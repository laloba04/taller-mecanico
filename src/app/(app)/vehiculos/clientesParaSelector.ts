import { crearClienteServidor } from "@/lib/supabase/server";
import type { OpcionCliente } from "./FormularioVehiculo";

/** Máximo de clientes que se cargan en el selector del formulario de vehículo. */
const LIMITE_SELECTOR = 1000;

/**
 * Clientes del usuario (RLS) ordenados por nombre, para el selector de cliente.
 * Si se indica `incluirId` (el cliente actual del vehículo) y queda fuera del
 * límite, se añade para que el selector siempre pueda preseleccionarlo.
 */
export async function clientesParaSelector(incluirId?: string): Promise<OpcionCliente[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre")
    .order("nombre")
    .limit(LIMITE_SELECTOR);
  if (error) throw new Error("No se pudieron cargar los clientes.");

  if (!incluirId || data.some((c) => c.id === incluirId)) return data;

  const { data: actual, error: errorActual } = await supabase
    .from("clientes")
    .select("id, nombre")
    .eq("id", incluirId)
    .maybeSingle();
  if (errorActual) throw new Error("No se pudieron cargar los clientes.");
  if (!actual) return data;

  return [...data, actual].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
