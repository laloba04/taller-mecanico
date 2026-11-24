import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validarConfigSupabase } from "./config";
import type { Database } from "./tipos";

/** Cliente de Supabase para Server Components, Server Actions y Route Handlers. */
export async function crearClienteServidor() {
  const { url, anonKey } = validarConfigSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const almacenCookies = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return almacenCookies.getAll();
      },
      setAll(cookiesAEscribir) {
        try {
          for (const { name, value, options } of cookiesAEscribir) {
            almacenCookies.set(name, value, options);
          }
        } catch {
          // Solo falla en Server Components, donde Next no permite escribir
          // cookies (el middleware refresca allí la sesión). En Server Actions
          // y Route Handlers `set` no lanza, así que la cookie del code
          // verifier de PKCE que escribe `signUp` llega al navegador.
        }
      },
    },
  });
}
