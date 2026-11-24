import { createBrowserClient } from "@supabase/ssr";
import { validarConfigSupabase } from "./config";
import type { Database } from "./tipos";

/** Cliente de Supabase para componentes de cliente ("use client"). */
export function crearClienteNavegador() {
  const { url, anonKey } = validarConfigSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  return createBrowserClient<Database>(url, anonKey);
}
