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
