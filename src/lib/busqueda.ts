/** Utilidades de búsqueda y de traducción de errores de base de datos. */

export const LONGITUD_MAXIMA_BUSQUEDA = 100;

/**
 * Patrón para `ilike` que busca `texto` en cualquier posición.
 * Escapa los comodines de LIKE (`%`, `_`) y la barra invertida, y quita `*`
 * (PostgREST lo trata como `%`). Devuelve null si no queda nada que buscar.
 */
export function patronBusqueda(texto: string | null | undefined): string | null {
  if (typeof texto !== "string") return null;
  const limpio = texto.replace(/\*/g, "").trim().slice(0, LONGITUD_MAXIMA_BUSQUEDA).trim();
  if (limpio === "") return null;
  const escapado = limpio.replace(/[\\%_]/g, (c) => `\\${c}`);
  return `%${escapado}%`;
}

/**
 * Filtro para `.or()` de PostgREST: `col1.ilike."patron",col2.ilike."patron"`.
 * El valor va entre comillas para que comas, puntos o paréntesis no rompan la sintaxis.
 */
export function filtroOrIlike(columnas: readonly string[], patron: string): string {
  const entrecomillado = `"${patron.replace(/["\\]/g, (c) => `\\${c}`)}"`;
  return columnas.map((columna) => `${columna}.ilike.${entrecomillado}`).join(",");
}

export type EntidadBD = "cliente" | "vehiculo";

export const MENSAJE_ERROR_BD_GENERICO = "No se pudieron guardar los cambios. Inténtalo de nuevo.";

/**
 * Traduce un error de Postgres/PostgREST a un mensaje en español.
 * Nunca devuelve el mensaje original (D17).
 */
export function mensajeErrorBD(error: unknown, entidad?: EntidadBD): string {
  if (typeof error !== "object" || error === null) return MENSAJE_ERROR_BD_GENERICO;
  const { code } = error as { code?: unknown };
  switch (code) {
    case "23505":
      return entidad === "vehiculo"
        ? "Ya existe un vehículo con esa matrícula."
        : "Ya existe un registro con esos datos.";
    case "23503":
      return "El cliente indicado no existe.";
    case "23514":
    case "22P02":
      return "Algún dato no tiene un formato válido.";
    default:
      return MENSAJE_ERROR_BD_GENERICO;
  }
}
