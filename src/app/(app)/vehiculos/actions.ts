"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { erroresPorCampo } from "@/lib/auth";
import { mensajeErrorBD } from "@/lib/busqueda";
import {
  esquemaId,
  textoDe,
  valoresFormulario,
  type EstadoFormulario,
} from "@/lib/formularios";
import { crearClienteServidor } from "@/lib/supabase/server";
import { CAMPOS_VEHICULO, esquemaVehiculo } from "@/lib/vehiculos";

const NO_ENCONTRADO = "No se encontró el vehículo. Puede que se haya eliminado.";

function revalidarVehiculos(id?: string) {
  revalidatePath("/vehiculos");
  if (id) revalidatePath(`/vehiculos/${id}`);
  // La ficha de cliente lista sus vehículos y el listado muestra cuántos tiene.
  revalidatePath("/clientes");
  revalidatePath("/clientes/[id]", "page");
}

/** La matrícula se guarda normalizada (D12): la transformación está en `esquemaVehiculo`. */
export async function crearVehiculo(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const valores = valoresFormulario(formData, CAMPOS_VEHICULO);
  const resultado = esquemaVehiculo.safeParse(valores);
  if (!resultado.success) {
    return { errores: erroresPorCampo(resultado.error), valores };
  }

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("vehiculos")
    .insert(resultado.data)
    .select("id")
    .single();
  if (error || !data) {
    return { error: mensajeErrorBD(error, "vehiculo"), valores };
  }

  revalidarVehiculos(data.id);
  redirect(`/vehiculos/${data.id}`);
}

export async function actualizarVehiculo(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const valores = valoresFormulario(formData, CAMPOS_VEHICULO);
  const id = esquemaId.safeParse(textoDe(formData, "id"));
  if (!id.success) {
    return { error: NO_ENCONTRADO, valores };
  }
  const resultado = esquemaVehiculo.safeParse(valores);
  if (!resultado.success) {
    return { errores: erroresPorCampo(resultado.error), valores };
  }

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("vehiculos")
    .update(resultado.data)
    .eq("id", id.data)
    .select("id");
  if (error) {
    return { error: mensajeErrorBD(error, "vehiculo"), valores };
  }
  if (data.length === 0) {
    return { error: NO_ENCONTRADO, valores };
  }

  revalidarVehiculos(id.data);
  redirect(`/vehiculos/${id.data}`);
}

export async function eliminarVehiculo(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const id = esquemaId.safeParse(textoDe(formData, "id"));
  if (!id.success) {
    return { error: NO_ENCONTRADO };
  }

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("vehiculos")
    .delete()
    .eq("id", id.data)
    .select("id, cliente_id");
  if (error) {
    return { error: mensajeErrorBD(error, "vehiculo") };
  }
  const borrado = data[0];
  if (!borrado) {
    return { error: NO_ENCONTRADO };
  }

  revalidarVehiculos(id.data);
  redirect(`/clientes/${borrado.cliente_id}`);
}
