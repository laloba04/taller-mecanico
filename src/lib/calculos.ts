/**
 * Cálculos de dinero (D10). Es el ÚNICO sitio de la app que calcula importes.
 *
 * - Los importes van siempre en céntimos enteros.
 * - Las cantidades se pasan a centésimas enteras (numeric(10,2) en la BD).
 * - Las multiplicaciones y sumas se hacen con BigInt, así que no hay errores
 *   de coma flotante ni pérdida de precisión con cantidades grandes.
 * - Redondeo determinista: al céntimo más cercano, y los ,5 hacia arriba.
 */

const SOLO_DIGITOS = /^\d+$/;
/** "1.234" o "1.234.567": punto como separador de miles en grupos de tres. */
const CON_MILES = /^\d{1,3}(?:\.\d{3})+$/;
/** "12.5" o "12.50": punto como separador decimal (1 o 2 decimales). */
const PUNTO_DECIMAL = /^(\d+)\.(\d{1,2})$/;
/** Representación de un `number` de JS con hasta 2 decimales (sin exponente). */
const NUMERO_DOS_DECIMALES = /^(\d+)(?:\.(\d{1,2}))?$/;

/** Límite de dígitos de la parte entera para no salir de los enteros seguros. */
const MAX_DIGITOS_ENTEROS = 13;

function componer(entero: string, decimales: string): number | null {
  if (entero.length > MAX_DIGITOS_ENTEROS || decimales.length > 2) return null;
  const valor = Number(entero) * 100 + Number(decimales.padEnd(2, "0"));
  return Number.isSafeInteger(valor) ? valor : null;
}

/**
 * Convierte un número decimal escrito en español a centésimas enteras.
 *
 * Acepta "12", "12,5", "12,50", "1.234,56", "1.234" (miles) y "12.50"
 * (punto decimal si lleva 1 o 2 decimales). Admite espacios alrededor y un
 * "€" final. Devuelve null si está vacío, es negativo, tiene más de 2
 * decimales o no es un número.
 */
function textoACentesimas(texto: string): number | null {
  const limpio = texto.trim().replace(/\s*€$/u, "").trim();
  if (limpio === "") return null;

  const partes = limpio.split(",");
  if (partes.length > 2) return null;

  if (partes.length === 2) {
    const [entero, decimales] = partes;
    if (!SOLO_DIGITOS.test(decimales)) return null;
    if (SOLO_DIGITOS.test(entero)) return componer(entero, decimales);
    if (CON_MILES.test(entero)) return componer(entero.replace(/\./g, ""), decimales);
    return null;
  }

  if (SOLO_DIGITOS.test(limpio)) return componer(limpio, "");
  if (CON_MILES.test(limpio)) return componer(limpio.replace(/\./g, ""), "");
  const punto = PUNTO_DECIMAL.exec(limpio);
  if (punto) return componer(punto[1], punto[2]);
  return null;
}

/**
 * Importe en euros escrito por el usuario → céntimos enteros.
 * "12" → 1200, "12,5" → 1250, "1.234,56" → 123456, "12.50" → 1250.
 * Negativos, más de 2 decimales, vacío o basura → null.
 */
export function eurosACentimos(texto: string): number | null {
  if (typeof texto !== "string") return null;
  return textoACentesimas(texto);
}

/**
 * Cantidad (unidades u horas) → centésimas enteras. Acepta el texto de un
 * formulario ("1,5") o el número que devuelve la BD (1.5). Máximo 2 decimales;
 * negativos, NaN, infinitos o basura → null.
 */
export function cantidadACentesimas(valor: string | number): number | null {
  if (typeof valor === "number") {
    if (!Number.isFinite(valor) || valor < 0) return null;
    // String(1.5) === "1.5": el número más corto que representa el double.
    const coincidencia = NUMERO_DOS_DECIMALES.exec(String(valor));
    if (!coincidencia) return null;
    return componer(coincidencia[1], coincidencia[2] ?? "");
  }
  if (typeof valor !== "string") return null;
  return textoACentesimas(valor);
}

/** Centésimas enteras → cantidad en unidades para guardar en numeric(10,2). 150 → 1.5 */
export function centesimasACantidad(centesimas: number): number {
  if (!Number.isSafeInteger(centesimas) || centesimas < 0) {
    throw new RangeError("Cantidad no válida.");
  }
  return centesimas / 100;
}

// Sin literales `100n`: el `target` de tsconfig es anterior a ES2020.
const CERO = BigInt(0);
const UNO = BigInt(1);
const DOS = BigInt(2);
const CIEN = BigInt(100);

function aEnteroSeguro(valor: bigint): number {
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero)) throw new RangeError("Importe demasiado grande.");
  return numero;
}

/** round(numerador / divisor) con los ,5 hacia arriba, para valores no negativos. */
function dividirRedondeando(numerador: bigint, divisor: bigint): bigint {
  const cociente = numerador / divisor;
  const resto = numerador % divisor;
  return resto * DOS >= divisor ? cociente + UNO : cociente;
}

function comprobarCentimos(centimos: number): bigint {
  if (!Number.isSafeInteger(centimos) || centimos < 0) {
    throw new RangeError("Precio no válido.");
  }
  return BigInt(centimos);
}

/**
 * Importe de una línea en céntimos: round(centésimas × precio / 100).
 * `cantidad` en unidades (como la devuelve la BD: 1.5) o como texto ("1,5").
 * Ejemplo: 1,5 h × 33,33 € = 49,995 € → 5000 céntimos (50,00 €).
 * Lanza RangeError si la cantidad o el precio no son válidos.
 */
export function importeLinea(cantidad: number | string, precioCentimos: number): number {
  const centesimas = cantidadACentesimas(cantidad);
  if (centesimas === null) throw new RangeError("Cantidad no válida.");
  const precio = comprobarCentimos(precioCentimos);
  return aEnteroSeguro(dividirRedondeando(BigInt(centesimas) * precio, CIEN));
}

export type LineaCalculo = {
  tipo: "pieza" | "mano_obra";
  cantidad: number | string;
  precio_unitario_centimos: number;
};

export type TotalesOrden = {
  piezas: number;
  manoObra: number;
  baseImponible: number;
  iva: number;
  total: number;
};

/**
 * Totales de una orden en céntimos. Cada línea se redondea al céntimo y el
 * IVA se calcula sobre la base imponible: iva = round(base × pct / 100).
 * Lanza RangeError si el porcentaje no es un entero entre 0 y 100.
 */
export function totalesOrden(
  lineas: readonly LineaCalculo[],
  ivaPorcentaje: number,
): TotalesOrden {
  if (!Number.isInteger(ivaPorcentaje) || ivaPorcentaje < 0 || ivaPorcentaje > 100) {
    throw new RangeError("Porcentaje de IVA no válido.");
  }

  let piezas = CERO;
  let manoObra = CERO;
  for (const linea of lineas) {
    const importe = BigInt(importeLinea(linea.cantidad, linea.precio_unitario_centimos));
    if (linea.tipo === "pieza") piezas += importe;
    else manoObra += importe;
  }
  const base = piezas + manoObra;
  const iva = dividirRedondeando(base * BigInt(ivaPorcentaje), CIEN);

  return {
    piezas: aEnteroSeguro(piezas),
    manoObra: aEnteroSeguro(manoObra),
    baseImponible: aEnteroSeguro(base),
    iva: aEnteroSeguro(iva),
    total: aEnteroSeguro(base + iva),
  };
}

/**
 * Como `totalesOrden`, pero devuelve null en lugar de lanzar si algún dato de
 * la BD no es válido o el total no cabe en un entero seguro. Para pintar
 * listados sin que una fila rara rompa la página.
 */
export function totalesOrdenSeguros(
  lineas: readonly LineaCalculo[],
  ivaPorcentaje: number,
): TotalesOrden | null {
  try {
    return totalesOrden(lineas, ivaPorcentaje);
  } catch (error) {
    if (error instanceof RangeError) return null;
    throw error;
  }
}

/** Como `importeLinea`, pero devuelve null en lugar de lanzar con datos no válidos. */
export function importeLineaSeguro(cantidad: number | string, precioCentimos: number): number | null {
  try {
    return importeLinea(cantidad, precioCentimos);
  } catch (error) {
    if (error instanceof RangeError) return null;
    throw error;
  }
}
