const euro = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatea un importe en céntimos enteros como euros (es-ES). */
export function formatEuro(centimos: number): string {
  return euro.format(centimos / 100);
}

const cantidad = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Formatea una cantidad (unidades u horas) con hasta 2 decimales (es-ES): 1.5 → "1,5". */
export function formatCantidad(valor: number | string): string {
  const numero = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(numero) ? cantidad.format(numero) : "—";
}

const fecha = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Madrid",
});

/** Fecha (ISO de la BD) en formato dd/mm/aaaa, hora de España. Vacía o inválida → "—". */
export function formatFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const valor = new Date(iso);
  return Number.isNaN(valor.getTime()) ? "—" : fecha.format(valor);
}
