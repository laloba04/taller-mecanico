import { isAuthError, isAuthPKCECodeVerifierMissingError } from "@supabase/supabase-js";
import { z } from "zod";

/** Códigos de `?error=` que `/login` sabe mostrar tras un fallo de confirmación. */
export const ERROR_CONFIRMACION = "confirmacion";
export const ERROR_CONFIRMADO_OTRO_NAVEGADOR = "confirmado-otro-navegador";

export type CodigoErrorConfirmacion =
  | typeof ERROR_CONFIRMACION
  | typeof ERROR_CONFIRMADO_OTRO_NAVEGADOR;

const TIPOS_OTP = ["signup", "invite", "magiclink", "recovery", "email_change", "email"] as const;

// Solo se exige que no esté vacío: el `code` de PKCE es un UUID hoy, pero
// Supabase no garantiza el formato y validar de más descartaría enlaces buenos.
const valorNoVacio = z.string().trim().min(1).max(2048);

const esquemaOtp = z.object({
  token_hash: valorNoVacio,
  type: z.enum(TIPOS_OTP),
});

const esquemaCodigo = z.object({
  code: valorNoVacio,
});

// Cuando /auth/v1/verify falla (enlace caducado o ya usado), Supabase redirige
// con `error`, `error_code` y `error_description` en lugar de `code`.
const esquemaErrorProveedor = z.object({
  error: valorNoVacio,
  error_code: z.string().trim().max(100).optional(),
});

export type ParametrosConfirmacion =
  | { tipo: "otp"; tokenHash: string; type: (typeof TIPOS_OTP)[number] }
  | { tipo: "codigo"; code: string }
  | { tipo: "error-proveedor"; codigoError: string }
  | { tipo: "invalido" };

/**
 * Interpreta los parámetros de `/auth/confirm`. Prioridad: `token_hash` + `type`
 * (no depende de cookies), después `code` (PKCE) y por último el error que
 * Supabase añade cuando no pudo verificar el enlace.
 */
export function parsearParametrosConfirmacion(
  parametros: URLSearchParams,
): ParametrosConfirmacion {
  const datos = Object.fromEntries(parametros);

  const otp = esquemaOtp.safeParse(datos);
  if (otp.success) {
    return { tipo: "otp", tokenHash: otp.data.token_hash, type: otp.data.type };
  }

  const codigo = esquemaCodigo.safeParse(datos);
  if (codigo.success) {
    return { tipo: "codigo", code: codigo.data.code };
  }

  const errorProveedor = esquemaErrorProveedor.safeParse(datos);
  if (errorProveedor.success) {
    return {
      tipo: "error-proveedor",
      codigoError: errorProveedor.data.error_code || errorProveedor.data.error,
    };
  }

  return { tipo: "invalido" };
}

/**
 * Código de `?error=` para un fallo al intercambiar el `code` por la sesión.
 * Si falta el code verifier (enlace abierto en otro navegador o cookies
 * borradas), Supabase ya ha confirmado el email antes de emitir el `code`,
 * así que basta con iniciar sesión. Se distingue por el tipo de error del SDK.
 */
export function codigoErrorIntercambio(error: unknown): CodigoErrorConfirmacion {
  return isAuthPKCECodeVerifierMissingError(error)
    ? ERROR_CONFIRMADO_OTRO_NAVEGADOR
    : ERROR_CONFIRMACION;
}

export type ResumenErrorAuth = {
  nombre: string;
  codigo: string | null;
  estado: number | null;
};

/**
 * Datos seguros para registrar en el servidor: nombre, código y estado HTTP.
 * Nunca incluye el mensaje (puede contener datos del usuario) ni el token.
 */
export function resumenErrorAuth(error: unknown): ResumenErrorAuth {
  if (isAuthError(error)) {
    return {
      nombre: error.name,
      codigo: typeof error.code === "string" ? error.code : null,
      estado: typeof error.status === "number" ? error.status : null,
    };
  }
  if (error instanceof Error) {
    return { nombre: error.name, codigo: null, estado: null };
  }
  return { nombre: "desconocido", codigo: null, estado: null };
}

export type ResumenCookiesPkce = {
  /** `sb-<ref>-auth-token-code-verifier`: el único que lee el servidor sin `sb_flow_id`. */
  verifierFijo: boolean;
  /** Número de `sb-<ref>-auth-token-flow-<id>-code-verifier`. */
  verifiersPorFlujo: number;
  /** `sb-<ref>-auth-token-flows-code-verifier` (índice de flujos pendientes). */
  indiceFlujos: boolean;
};

const PATRON_VERIFIER_POR_FLUJO = /^sb-.+-flow-[A-Za-z0-9_-]{8,64}-code-verifier(\.\d+)?$/;
const PATRON_INDICE_FLUJOS = /^sb-.+-flows-code-verifier(\.\d+)?$/;
const PATRON_VERIFIER_FIJO = /^sb-.+-auth-token-code-verifier(\.\d+)?$/;

/**
 * Resume qué cookies de PKCE llegaron a `/auth/confirm` para diagnosticar un
 * `pkce_code_verifier_not_found` en el log del servidor. Solo usa los nombres
 * (nunca los valores) y no se muestra al usuario (D17).
 */
export function resumenCookiesPkce(nombres: readonly string[]): ResumenCookiesPkce {
  const porFlujo = new Set<string>();
  let verifierFijo = false;
  let indiceFlujos = false;
  for (const nombre of nombres) {
    if (PATRON_VERIFIER_POR_FLUJO.test(nombre)) {
      porFlujo.add(nombre.replace(/\.\d+$/, ""));
    } else if (PATRON_INDICE_FLUJOS.test(nombre)) {
      indiceFlujos = true;
    } else if (PATRON_VERIFIER_FIJO.test(nombre)) {
      verifierFijo = true;
    }
  }
  return { verifierFijo, verifiersPorFlujo: porFlujo.size, indiceFlujos };
}
