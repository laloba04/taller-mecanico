"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { erroresPorCampo } from "@/lib/auth";
import { MENSAJE_ESTADO_ORDEN_NO_PERMITIDO, mensajeErrorBD } from "@/lib/busqueda";
import { centesimasACantidad } from "@/lib/calculos";
import { esEditable, esEstado, puedeTransicionar, siguienteEstado } from "@/lib/estados";
import {
  esquemaId,
  textoDe,
  valoresFormulario,
  type EstadoFormulario,
} from "@/lib/formularios";
import {
  CAMPOS_EDITAR_ORDEN,
  CAMPOS_LINEA,
  CAMPOS_ORDEN,
  esquemaActualizarOrden,
  esquemaAvanzarEstado,
  esquemaCrearOrden,
  esquemaLinea,
} from "@/lib/ordenes";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { EstadoOrden } from "@/lib/supabase/tipos";

const NO_ENCONTRADA = "No se encontró la orden. Puede que se haya eliminado.";
const LINEA_NO_ENCONTRADA = "No se encontró la línea. Puede que se haya eliminado.";
const ORDEN_CAMBIADA = "La orden ha cambiado; recarga la página.";
const ORDEN_ENTREGADA = "Orden entregada: no se puede modificar.";
const ERROR_CARGA = "No se pudo comprobar la orden. Inténtalo de nuevo.";

type ClienteSupabase = Awaited<ReturnType<typeof crearClienteServidor>>;

function revalidarOrdenes(id?: string) {
  revalidatePath("/ordenes");
  if (id) revalidatePath(`/ordenes/${id}`);
  // La ficha del vehículo lista sus órdenes con estado y total.
  revalidatePath("/vehiculos/[id]", "page");
}

type LecturaEstado =
  | { tipo: "ok"; estado: EstadoOrden }
  | { tipo: "no-encontrada" }
  | { tipo: "error" };

/** Estado actual de una orden del usuario (RLS) para comprobarlo en servidor. */
async function leerEstado(supabase: ClienteSupabase, id: string): Promise<LecturaEstado> {
  const { data, error } = await supabase
    .from("ordenes")
    .select("estado")
    .eq("id", id)
    .maybeSingle();
  if (error) return { tipo: "error" };
  if (!data || !esEstado(data.estado)) return { tipo: "no-encontrada" };
  return { tipo: "ok", estado: data.estado };
}

/** Comprueba que la orden existe y se puede modificar; devuelve el mensaje de error o el estado. */
async function comprobarEditable(
  supabase: ClienteSupabase,
  id: string,
): Promise<{ error: string } | { estado: EstadoOrden }> {
  const lectura = await leerEstado(supabase, id);
  if (lectura.tipo === "error") return { error: ERROR_CARGA };
  if (lectura.tipo === "no-encontrada") return { error: NO_ENCONTRADA };
  if (!esEditable(lectura.estado)) return { error: ORDEN_ENTREGADA };
  return { estado: lectura.estado };
}

export async function crearOrden(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const valores = valoresFormulario(formData, CAMPOS_ORDEN);
  const resultado = esquemaCrearOrden.safeParse(valores);
  if (!resultado.success) {
    return { errores: erroresPorCampo(resultado.error), valores };
  }

  const supabase = await crearClienteServidor();
  // El estado inicial ('recibido') lo pone la BD.
  const { data, error } = await supabase
    .from("ordenes")
    .insert(resultado.data)
    .select("id")
    .single();
  if (error || !data) {
    return { error: mensajeErrorBD(error, "orden"), valores };
  }

  revalidarOrdenes(data.id);
  redirect(`/ordenes/${data.id}`);
}

/** Edita descripción e IVA (solo si la orden no está entregada). */
export async function actualizarOrden(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const valores = valoresFormulario(formData, CAMPOS_EDITAR_ORDEN);
  const resultado = esquemaActualizarOrden.safeParse({ ...valores, id: textoDe(formData, "id") });
  if (!resultado.success) {
    const errores = erroresPorCampo(resultado.error);
    if (errores.id) return { error: NO_ENCONTRADA, valores };
    return { errores, valores };
  }
  const { id, descripcion, iva_porcentaje } = resultado.data;

  const supabase = await crearClienteServidor();
  const comprobacion = await comprobarEditable(supabase, id);
  if ("error" in comprobacion) return { error: comprobacion.error, valores };

  // `.eq("estado", …)`: si alguien la ha entregado entretanto, no se actualiza nada.
  const { data, error } = await supabase
    .from("ordenes")
    .update({ descripcion, iva_porcentaje })
    .eq("id", id)
    .eq("estado", comprobacion.estado)
    .select("id");
  if (error) return { error: mensajeErrorBD(error, "orden"), valores };
  if (data.length === 0) return { error: ORDEN_CAMBIADA, valores };

  revalidarOrdenes(id);
  return { exito: "Cambios guardados.", valores };
}

/** Pasa la orden al estado siguiente (D11), solo si sigue en el estado que veía el usuario. */
export async function avanzarEstado(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const resultado = esquemaAvanzarEstado.safeParse({
    id: textoDe(formData, "id"),
    estado: textoDe(formData, "estado"),
  });
  if (!resultado.success) return { error: ORDEN_CAMBIADA };
  const { id, estado: actual } = resultado.data;

  const siguiente = siguienteEstado(actual);
  if (!siguiente || !puedeTransicionar(actual, siguiente)) {
    return { error: MENSAJE_ESTADO_ORDEN_NO_PERMITIDO };
  }

  const supabase = await crearClienteServidor();
  // fecha_entrega la pone el trigger de la BD al pasar a 'entregado'.
  const { data, error } = await supabase
    .from("ordenes")
    .update({ estado: siguiente })
    .eq("id", id)
    .eq("estado", actual)
    .select("id");
  if (error) return { error: mensajeErrorBD(error, "orden") };
  if (data.length === 0) return { error: ORDEN_CAMBIADA };

  revalidarOrdenes(id);
  return {};
}

export async function anadirLinea(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const valores = valoresFormulario(formData, CAMPOS_LINEA);
  const resultado = esquemaLinea.safeParse({ ...valores, orden_id: textoDe(formData, "orden_id") });
  if (!resultado.success) {
    const errores = erroresPorCampo(resultado.error);
    if (errores.orden_id) return { error: NO_ENCONTRADA, valores };
    return { errores, valores };
  }
  const { orden_id, tipo, descripcion, cantidad, precio } = resultado.data;

  const supabase = await crearClienteServidor();
  const comprobacion = await comprobarEditable(supabase, orden_id);
  if ("error" in comprobacion) return { error: comprobacion.error, valores };

  // Si la orden se entrega entre la comprobación y el insert, lo rechaza el trigger.
  const { error } = await supabase.from("lineas_orden").insert({
    orden_id,
    tipo,
    descripcion,
    cantidad: centesimasACantidad(cantidad),
    precio_unitario_centimos: precio,
  });
  if (error) return { error: mensajeErrorBD(error, "linea"), valores };

  revalidarOrdenes(orden_id);
  // Sin `valores`: el formulario se vacía para la siguiente línea.
  return {};
}

export async function eliminarLinea(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const id = esquemaId.safeParse(textoDe(formData, "id"));
  if (!id.success) return { error: LINEA_NO_ENCONTRADA };

  const supabase = await crearClienteServidor();
  const { data: linea, error: errorLectura } = await supabase
    .from("lineas_orden")
    .select("id, orden_id")
    .eq("id", id.data)
    .maybeSingle();
  if (errorLectura) return { error: ERROR_CARGA };
  if (!linea) return { error: LINEA_NO_ENCONTRADA };

  const comprobacion = await comprobarEditable(supabase, linea.orden_id);
  if ("error" in comprobacion) return { error: comprobacion.error };

  const { data, error } = await supabase
    .from("lineas_orden")
    .delete()
    .eq("id", id.data)
    .select("id");
  if (error) return { error: mensajeErrorBD(error, "linea") };
  if (data.length === 0) return { error: LINEA_NO_ENCONTRADA };

  revalidarOrdenes(linea.orden_id);
  return {};
}

/** Borra la orden y, en cascada, sus líneas (permitido en cualquier estado). */
export async function eliminarOrden(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const id = esquemaId.safeParse(textoDe(formData, "id"));
  if (!id.success) return { error: NO_ENCONTRADA };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("ordenes")
    .delete()
    .eq("id", id.data)
    .select("id, vehiculo_id");
  if (error) return { error: mensajeErrorBD(error, "orden") };
  const borrada = data[0];
  if (!borrada) return { error: NO_ENCONTRADA };

  revalidarOrdenes(id.data);
  redirect(`/vehiculos/${borrada.vehiculo_id}`);
}
