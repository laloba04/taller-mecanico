import { z } from "zod";

/** Estado que devuelven las Server Actions de formularios a `useActionState`. */
export type EstadoFormulario = {
  /** Error general (por ejemplo, de base de datos), ya traducido al español. */
  error?: string;
  /** Mensaje de confirmación cuando la acción no redirige (p. ej. "Cambios guardados."). */
  exito?: string;
  /** Primer error de cada campo. */
  errores?: Record<string, string>;
  /** Valores enviados, para no perderlos al volver a pintar el formulario tras un error. */
  valores?: Record<string, string>;
};

export const ESTADO_FORMULARIO_INICIAL: EstadoFormulario = {};

/** Identificador de fila (uuid) con mensaje en español. */
export const esquemaId = z.uuid({ error: "Identificador no válido." });

export function esIdValido(id: unknown): id is string {
  return esquemaId.safeParse(id).success;
}

/** Valor de texto de un campo de FormData, o null si falta o es un archivo. */
export function textoDe(formData: FormData, campo: string): string | null {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor : null;
}

/** Objeto con los campos de texto indicados (los ausentes quedan como cadena vacía). */
export function valoresFormulario(
  formData: FormData,
  campos: readonly string[],
): Record<string, string> {
  const valores: Record<string, string> = {};
  for (const campo of campos) valores[campo] = textoDe(formData, campo) ?? "";
  return valores;
}

/** Recorta cadenas y convierte vacías (o ausentes) en null; el resto lo deja igual. */
export function vacioANull(valor: unknown): unknown {
  if (valor === undefined || valor === null) return null;
  if (typeof valor !== "string") return valor;
  const recortado = valor.trim();
  return recortado === "" ? null : recortado;
}

/**
 * Convierte texto de un campo numérico entero en número.
 * Admite separadores de miles con punto o espacio ("150.000" → 150000).
 * Si no es un entero, devuelve NaN para que Zod lo rechace. Null/vacío → null.
 */
export function enteroDesdeTexto(valor: unknown): unknown {
  const normal = vacioANull(valor);
  if (typeof normal !== "string") return normal;
  const sinSeparadores = normal.replace(/[\s.]/g, "");
  return /^-?\d+$/.test(sinSeparadores) ? Number(sinSeparadores) : Number.NaN;
}
