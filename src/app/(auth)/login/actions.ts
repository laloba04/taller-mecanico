"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  MENSAJE_ERROR_GENERICO,
  erroresPorCampo,
  esquemaLogin,
  esquemaRegistro,
  mensajeErrorAuth,
} from "@/lib/auth";
import { destinoSeguro, origenDesdeCabeceras } from "@/lib/rutas";
import { crearClienteServidor } from "@/lib/supabase/server";

export type EstadoFormularioAuth = {
  error?: string;
  errores?: Record<string, string>;
  exito?: string;
  /** Email introducido, para no obligar a reescribirlo tras un error. */
  email?: string;
};

function textoDe(formData: FormData, campo: string): string | null {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor : null;
}

export async function iniciarSesion(
  _estadoPrevio: EstadoFormularioAuth,
  formData: FormData,
): Promise<EstadoFormularioAuth> {
  const email = textoDe(formData, "email") ?? "";
  const resultado = esquemaLogin.safeParse({
    email,
    password: textoDe(formData, "password"),
  });
  if (!resultado.success) {
    return { errores: erroresPorCampo(resultado.error), email };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword(resultado.data);
  if (error) {
    return { error: mensajeErrorAuth(error), email };
  }

  redirect(destinoSeguro(textoDe(formData, "siguiente")));
}

export async function registrarse(
  _estadoPrevio: EstadoFormularioAuth,
  formData: FormData,
): Promise<EstadoFormularioAuth> {
  const email = textoDe(formData, "email") ?? "";
  const resultado = esquemaRegistro.safeParse({
    email,
    password: textoDe(formData, "password"),
    confirmacion: textoDe(formData, "confirmacion"),
  });
  if (!resultado.success) {
    return { errores: erroresPorCampo(resultado.error), email };
  }

  const origen = origenDesdeCabeceras(await headers());
  if (!origen) {
    return { error: MENSAJE_ERROR_GENERICO, email };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signUp({
    email: resultado.data.email,
    password: resultado.data.password,
    options: { emailRedirectTo: `${origen}/auth/confirm` },
  });
  if (error) {
    return { error: mensajeErrorAuth(error), email };
  }

  return { exito: "Revisa tu correo para confirmar la cuenta.", email: resultado.data.email };
}
