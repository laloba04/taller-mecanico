"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { erroresPorCampo } from "@/lib/auth";
import { mensajeErrorBD } from "@/lib/busqueda";
import { CAMPOS_CLIENTE, esquemaCliente } from "@/lib/clientes";
import {
  esquemaId,
  textoDe,
  valoresFormulario,
  type EstadoFormulario,
} from "@/lib/formularios";
import { crearClienteServidor } from "@/lib/supabase/server";

const NO_ENCONTRADO = "No se encontró el cliente. Puede que se haya eliminado.";

function revalidarClientes(id?: string) {
  revalidatePath("/clientes");
  if (id) revalidatePath(`/clientes/${id}`);
}

export async function crearCliente(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const valores = valoresFormulario(formData, CAMPOS_CLIENTE);
  const resultado = esquemaCliente.safeParse(valores);
  if (!resultado.success) {
    return { errores: erroresPorCampo(resultado.error), valores };
  }

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("clientes")
    .insert(resultado.data)
    .select("id")
    .single();
  if (error || !data) {
    return { error: mensajeErrorBD(error, "cliente"), valores };
  }

  revalidarClientes(data.id);
  redirect(`/clientes/${data.id}`);
}

export async function actualizarCliente(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const valores = valoresFormulario(formData, CAMPOS_CLIENTE);
  const id = esquemaId.safeParse(textoDe(formData, "id"));
  if (!id.success) {
    return { error: NO_ENCONTRADO, valores };
  }
  const resultado = esquemaCliente.safeParse(valores);
  if (!resultado.success) {
    return { errores: erroresPorCampo(resultado.error), valores };
  }

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("clientes")
    .update(resultado.data)
    .eq("id", id.data)
    .select("id");
  if (error) {
    return { error: mensajeErrorBD(error, "cliente"), valores };
  }
  if (data.length === 0) {
    return { error: NO_ENCONTRADO, valores };
  }

  revalidarClientes(id.data);
  revalidatePath("/vehiculos");
  redirect(`/clientes/${id.data}`);
}

export async function eliminarCliente(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const id = esquemaId.safeParse(textoDe(formData, "id"));
  if (!id.success) {
    return { error: NO_ENCONTRADO };
  }

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("clientes").delete().eq("id", id.data).select("id");
  if (error) {
    return { error: mensajeErrorBD(error, "cliente") };
  }
  if (data.length === 0) {
    return { error: NO_ENCONTRADO };
  }

  revalidarClientes(id.data);
  revalidatePath("/vehiculos");
  redirect("/clientes");
}
