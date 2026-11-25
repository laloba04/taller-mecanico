import { formatearMatricula } from "@/lib/matricula";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { OpcionVehiculo } from "./FormularioOrden";

/** Máximo de vehículos que se cargan en el selector del formulario de orden. */
const LIMITE_SELECTOR = 1000;

type FilaVehiculo = {
  id: string;
  matricula: string;
  marca: string | null;
  modelo: string | null;
  clientes: { nombre: string } | null;
};

function aOpcion(v: FilaVehiculo): OpcionVehiculo {
  const partes = [
    formatearMatricula(v.matricula),
    [v.marca, v.modelo].filter(Boolean).join(" "),
    v.clientes?.nombre ?? "",
  ].filter((p) => p !== "");
  return { id: v.id, etiqueta: partes.join(" · ") };
}

const COLUMNAS = "id, matricula, marca, modelo, clientes(nombre)";

/**
 * Vehículos del usuario (RLS) ordenados por matrícula, para el selector.
 * Si se indica `incluirId` y queda fuera del límite, se añade si es del usuario.
 */
export async function vehiculosParaSelector(incluirId?: string): Promise<OpcionVehiculo[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("vehiculos")
    .select(COLUMNAS)
    .order("matricula")
    .limit(LIMITE_SELECTOR);
  if (error) throw new Error("No se pudieron cargar los vehículos.");
  const filas: FilaVehiculo[] = data;

  if (!incluirId || filas.some((v) => v.id === incluirId)) return filas.map(aOpcion);

  const { data: actual, error: errorActual } = await supabase
    .from("vehiculos")
    .select(COLUMNAS)
    .eq("id", incluirId)
    .maybeSingle();
  if (errorActual) throw new Error("No se pudieron cargar los vehículos.");
  if (!actual) return filas.map(aOpcion);

  const todas: FilaVehiculo[] = [...filas, actual];
  return todas
    .sort((a, b) => a.matricula.localeCompare(b.matricula, "es"))
    .map(aOpcion);
}
