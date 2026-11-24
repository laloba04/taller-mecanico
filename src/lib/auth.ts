import { z } from "zod";

const campoEmail = z
  .string({ error: "Introduce tu email." })
  .trim()
  .min(1, { error: "Introduce tu email." })
  .pipe(z.email({ error: "Introduce un email válido." }));

export const esquemaLogin = z.object({
  email: campoEmail,
  password: z
    .string({ error: "Introduce tu contraseña." })
    .min(1, { error: "Introduce tu contraseña." }),
});

export const esquemaRegistro = z
  .object({
    email: campoEmail,
    password: z
      .string({ error: "Introduce una contraseña." })
      .min(8, { error: "La contraseña debe tener al menos 8 caracteres." }),
    confirmacion: z.string({ error: "Repite la contraseña." }),
  })
  .refine((datos) => datos.password === datos.confirmacion, {
    error: "Las contraseñas no coinciden.",
    path: ["confirmacion"],
  });

export type DatosLogin = z.infer<typeof esquemaLogin>;
export type DatosRegistro = z.infer<typeof esquemaRegistro>;

export const MENSAJE_ERROR_GENERICO = "No se pudo completar la operación. Inténtalo de nuevo.";

const MENSAJE_DEMASIADOS_INTENTOS = "Demasiados intentos. Espera unos minutos y vuelve a probar.";

const MENSAJES_POR_CODIGO: Readonly<Record<string, string>> = {
  invalid_credentials: "Email o contraseña incorrectos.",
  email_not_confirmed: "Debes confirmar tu email antes de entrar. Revisa tu correo.",
  user_already_exists: "Ya existe una cuenta con ese email.",
  email_exists: "Ya existe una cuenta con ese email.",
  over_request_rate_limit: MENSAJE_DEMASIADOS_INTENTOS,
  over_email_send_rate_limit: MENSAJE_DEMASIADOS_INTENTOS,
  weak_password: "La contraseña es demasiado débil. Elige otra más segura.",
};

/**
 * Traduce un error de Supabase Auth a un mensaje genérico en español.
 * Nunca devuelve el mensaje original del servidor (D17).
 */
export function mensajeErrorAuth(error: unknown): string {
  if (typeof error !== "object" || error === null) return MENSAJE_ERROR_GENERICO;
  const { code, status } = error as { code?: unknown; status?: unknown };
  if (typeof code === "string" && Object.hasOwn(MENSAJES_POR_CODIGO, code)) {
    return MENSAJES_POR_CODIGO[code];
  }
  if (status === 429) return MENSAJE_DEMASIADOS_INTENTOS;
  return MENSAJE_ERROR_GENERICO;
}

/** Primer mensaje de error de cada campo a partir de un ZodError. */
export function erroresPorCampo(error: z.ZodError): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "formulario");
    if (!(campo in errores)) errores[campo] = issue.message;
  }
  return errores;
}
