import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { RUTA_INICIO, RUTA_LOGIN, esRutaPublica } from "@/lib/rutas";
import { validarConfigSupabase } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/tipos";

/**
 * Refresca la sesión de Supabase en cada petición y protege las rutas (D13):
 * sin sesión, toda ruta salvo `/login` y `/auth/*` redirige a `/login`.
 */
export async function middleware(request: NextRequest) {
  const { url, anonKey } = validarConfigSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesAEscribir) {
        for (const { name, value } of cookiesAEscribir) {
          request.cookies.set(name, value);
        }
        respuesta = NextResponse.next({ request });
        for (const { name, value, options } of cookiesAEscribir) {
          respuesta.cookies.set(name, value, options);
        }
      },
    },
  });

  // No poner código entre createServerClient y getUser(): getUser() refresca el token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && !esRutaPublica(pathname)) {
    const destino = request.nextUrl.clone();
    destino.pathname = RUTA_LOGIN;
    destino.search = "";
    if (pathname !== "/") destino.searchParams.set("siguiente", `${pathname}${search}`);
    return redirigirConCookies(destino, respuesta);
  }

  if (user && pathname === RUTA_LOGIN) {
    const destino = request.nextUrl.clone();
    destino.pathname = RUTA_INICIO;
    destino.search = "";
    return redirigirConCookies(destino, respuesta);
  }

  return respuesta;
}

/** Redirige conservando las cookies de sesión que Supabase haya actualizado. */
function redirigirConCookies(destino: URL, respuesta: NextResponse): NextResponse {
  const redireccion = NextResponse.redirect(destino);
  for (const cookie of respuesta.cookies.getAll()) {
    redireccion.cookies.set(cookie);
  }
  return redireccion;
}

export const config = {
  matcher: [
    // Todo salvo estáticos de Next, optimizador de imágenes, favicon e imágenes.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|avif)$).*)",
  ],
};
