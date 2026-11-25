import { z } from "zod";
import { patronBusqueda } from "./busqueda";
import { cantidadACentesimas, eurosACentimos } from "./calculos";
import { ESTADOS, esEstado, type EstadoOrden } from "./estados";
import { enteroDesdeTexto, vacioANull } from "./formularios";
import { normalizarMatricula } from "./matricula";
import type { TipoLinea } from "./supabase/tipos";

/** Tipos de IVA que ofrece el selector (general, reducido, superreducido y exento). */
export const IVAS_DISPONIBLES = [21, 10, 4, 0] as const;
export const IVA_POR_DEFECTO = 21;

export const DESCRIPCION_ORDEN_MAXIMA = 2000;
export const DESCRIPCION_LINEA_MAXIMA = 200;
/** 9.999,99 unidades u horas por línea. */
export const CANTIDAD_MAXIMA_CENTESIMAS = 999_999;
/** 999.999,99 € por unidad. */
export const PRECIO_MAXIMO_CENTIMOS = 99_999_999;

export const TIPOS_LINEA = ["pieza", "mano_obra"] as const satisfies readonly TipoLinea[];

export const ETIQUETA_TIPO_LINEA: Readonly<Record<TipoLinea, string>> = {
  pieza: "Pieza",
  mano_obra: "Mano de obra",
};

export const CAMPOS_ORDEN = ["vehiculo_id", "descripcion", "iva_porcentaje"] as const;
export const CAMPOS_EDITAR_ORDEN = ["descripcion", "iva_porcentaje"] as const;
export const CAMPOS_LINEA = ["tipo", "descripcion", "cantidad", "precio"] as const;

const descripcionOrden = z.preprocess(
  vacioANull,
  z
    .string()
    .max(DESCRIPCION_ORDEN_MAXIMA, {
      error: `La descripción no puede superar ${DESCRIPCION_ORDEN_MAXIMA} caracteres.`,
    })
    .nullable(),
);

const ivaPorcentaje = z.preprocess(
  enteroDesdeTexto,
  z
    .number({ error: "Elige el tipo de IVA." })
    .int({ error: "El IVA debe ser un número entero." })
    .min(0, { error: "El IVA debe estar entre 0 y 100." })
    .max(100, { error: "El IVA debe estar entre 0 y 100." }),
);

/** Alta de orden desde el formulario (todos los valores llegan como texto). */
export const esquemaCrearOrden = z.object({
  vehiculo_id: z.uuid({ error: "Elige un vehículo." }),
  descripcion: descripcionOrden,
  iva_porcentaje: ivaPorcentaje,
});

/** Edición de descripción e IVA de una orden. */
export const esquemaActualizarOrden = z.object({
  id: z.uuid({ error: "Identificador no válido." }),
  descripcion: descripcionOrden,
  iva_porcentaje: ivaPorcentaje,
});

const MENSAJE_CANTIDAD = "Cantidad no válida: usa un número con hasta 2 decimales (p. ej. 1,5).";
const MENSAJE_PRECIO = "Precio no válido: usa euros con hasta 2 decimales (p. ej. 45,90).";

/**
 * Texto decimal de formulario → entero (centésimas o céntimos) con `convertir`.
 * Vacío → `mensajeVacio`; formato no válido (negativo, >2 decimales…) → `mensajeFormato`.
 */
function decimalEntero(
  convertir: (texto: string) => number | null,
  mensajeVacio: string,
  mensajeFormato: string,
) {
  return z.preprocess(
    (valor) => {
      const texto = vacioANull(valor);
      if (texto === null) return undefined;
      if (typeof texto !== "string") return Number.NaN;
      return convertir(texto) ?? Number.NaN;
    },
    z.number({
      error: (issue) => (issue.input === undefined ? mensajeVacio : mensajeFormato),
    }),
  );
}

/**
 * Línea de orden. `cantidad` sale en centésimas enteras y `precio` en
 * céntimos enteros (conversión en `calculos.ts`).
 */
export const esquemaLinea = z.object({
  orden_id: z.uuid({ error: "Identificador de orden no válido." }),
  tipo: z.enum(TIPOS_LINEA, { error: "Elige pieza o mano de obra." }),
  descripcion: z
    .string({ error: "Introduce la descripción." })
    .trim()
    .min(1, { error: "Introduce la descripción." })
    .max(DESCRIPCION_LINEA_MAXIMA, {
      error: `La descripción no puede superar ${DESCRIPCION_LINEA_MAXIMA} caracteres.`,
    }),
  cantidad: decimalEntero(
    cantidadACentesimas,
    "Introduce la cantidad.",
    MENSAJE_CANTIDAD,
  ).pipe(
    z
      .number()
      .min(1, { error: "La cantidad debe ser mayor que 0." })
      .max(CANTIDAD_MAXIMA_CENTESIMAS, { error: "La cantidad no puede superar 9.999,99." }),
  ),
  precio: decimalEntero(eurosACentimos, "Introduce el precio.", MENSAJE_PRECIO).pipe(
    z
      .number()
      .max(PRECIO_MAXIMO_CENTIMOS, { error: "El precio no puede superar 999.999,99 €." }),
  ),
});

export type DatosLinea = z.infer<typeof esquemaLinea>;

/** Avance de estado: id de la orden y el estado que el usuario veía (control de carreras). */
export const esquemaAvanzarEstado = z.object({
  id: z.uuid({ error: "Identificador no válido." }),
  estado: z.enum(ESTADOS, { error: "Estado no válido." }),
});

/** Estado de `?estado=` o null si falta o no es válido. */
export function estadoDesdeParametro(valor: unknown): EstadoOrden | null {
  return esEstado(valor) ? valor : null;
}

/** Enlace al listado de órdenes conservando el filtro de estado y la búsqueda. */
export function hrefListadoOrdenes({
  estado,
  q,
}: {
  estado?: EstadoOrden | null;
  q?: string | null;
}): string {
  const parametros = new URLSearchParams();
  if (estado) parametros.set("estado", estado);
  const texto = q?.trim();
  if (texto) parametros.set("q", texto);
  const cadena = parametros.toString();
  return cadena ? `/ordenes?${cadena}` : "/ordenes";
}

export type PatronesBusquedaOrden = {
  /** Patrón `ilike` para la matrícula, ya normalizada (D12). */
  matricula: string | null;
  /** Patrón `ilike` para el nombre del cliente, tal cual. */
  nombre: string | null;
};

/** Patrones de búsqueda del listado de órdenes, o null si no hay nada que buscar. */
export function patronesBusquedaOrden(texto: string): PatronesBusquedaOrden | null {
  const matricula = patronBusqueda(normalizarMatricula(texto));
  const nombre = patronBusqueda(texto);
  if (!matricula && !nombre) return null;
  return { matricula, nombre };
}
