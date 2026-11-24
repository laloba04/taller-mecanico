"use server";

import { redirect } from "next/navigation";
import { RUTA_LOGIN } from "@/lib/rutas";
import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Cierra la sesión del usuario actual.
 * No recibe datos del formulario, así que no hay entrada que validar con Zod (D09)
 * y no consulta tablas: solo llama a Supabase Auth.
 */
export async function cerrarSesion(): Promise<void> {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect(RUTA_LOGIN);
}
