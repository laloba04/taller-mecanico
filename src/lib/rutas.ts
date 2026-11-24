/** Página a la que se envía al usuario tras iniciar sesión. */
export const RUTA_INICIO = "/panel";

/** Página de inicio de sesión. */
export const RUTA_LOGIN = "/login";

/** Rutas accesibles sin sesión: `/login` y todo lo que cuelga de `/auth/`. */
export function esRutaPublica(pathname: string): boolean {
  if (pathname === RUTA_LOGIN || pathname === `${RUTA_LOGIN}/`) return true;
  return esRutaCallbackAuth(pathname);
}

/**
 * Rutas `/auth/*` (callbacks de confirmación). El middleware no debe tocar la
 * sesión en ellas: si hubiera una cookie de sesión inválida, `getUser()` la
 * eliminaría junto con la cookie del code verifier de PKCE, y el route handler
 * ya no podría intercambiar el `code`. Ellas mismas crean la sesión.
 */
export function esRutaCallbackAuth(pathname: string): boolean {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}

// Caracteres de control o barra invertida: los navegadores pueden
// interpretar "/\malo.com" como "//malo.com".
const CARACTERES_PELIGROSOS = /[\u0000-\u001f\u007f\\]/;

/**
 * Devuelve `siguiente` solo si es una ruta interna segura (empieza por "/",
 * no por "//" y sin barras invertidas ni caracteres de control), para evitar
 * redirecciones abiertas. En cualquier otro caso devuelve `/panel`.
 */
export function destinoSeguro(siguiente: string | null | undefined): string {
  if (typeof siguiente !== "string") return RUTA_INICIO;
  if (!siguiente.startsWith("/") || siguiente.startsWith("//")) return RUTA_INICIO;
  if (CARACTERES_PELIGROSOS.test(siguiente)) return RUTA_INICIO;
  return siguiente;
}

type LectorCabeceras = { get(nombre: string): string | null };

/**
 * Obtiene el origen (protocolo + host) de la petición a partir de sus cabeceras.
 * Devuelve null si no se puede determinar.
 */
export function origenDesdeCabeceras(cabeceras: LectorCabeceras): string | null {
  const origen = cabeceras.get("origin");
  if (origen && /^https?:\/\/[^/\s]+$/.test(origen)) return origen;

  const host = cabeceras.get("x-forwarded-host") ?? cabeceras.get("host");
  if (!host || !/^[^/\s\\]+$/.test(host)) return null;

  const protoCabecera = cabeceras.get("x-forwarded-proto")?.split(",")[0]?.trim();
  let protocolo: "http" | "https";
  if (protoCabecera === "http" || protoCabecera === "https") {
    protocolo = protoCabecera;
  } else {
    protocolo = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  }
  return `${protocolo}://${host}`;
}
