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
          // Desde un Server Component no se pueden escribir cookies;
          // el middleware se encarga de refrescar la sesión.
        }
      },
    },
  });
}
