import type { Metadata } from "next";
import Link from "next/link";
import { Buscador } from "@/components/Buscador";
import { claseBotonPrimario } from "@/components/estilos";
import { ListaResponsive } from "@/components/ListaResponsive";
import { ESTADOS, ETIQUETA_ESTADO, type EstadoOrden } from "@/lib/estados";
import {
  estadoDesdeParametro,
  hrefListadoOrdenes,
  patronesBusquedaOrden,
  type PatronesBusquedaOrden,
} from "@/lib/ordenes";
import { crearClienteServidor } from "@/lib/supabase/server";
import { COLUMNAS_LISTADO_ORDENES, type FilaResumenOrden } from "./columnasOrden";

export const metadata: Metadata = { title: "Órdenes · Taller mecánico" };

const LIMITE = 100;
/**
 * Máximo de vehículos coincidentes por criterio de búsqueda. Sus ids viajan en
 * la URL de PostgREST (`vehiculo_id=in.(…)`), así que se acota la longitud.
 */
const LIMITE_VEHICULOS_BUSQUEDA = 100;

type ClienteSupabase = Awaited<ReturnType<typeof crearClienteServidor>>;

/** Ids de vehículos cuya matrícula (normalizada) o nombre de cliente coinciden. */
async function vehiculosCoincidentes(
  supabase: ClienteSupabase,
  patrones: PatronesBusquedaOrden,
): Promise<string[]> {
  const [porMatricula, porCliente] = await Promise.all([
    patrones.matricula
      ? supabase
          .from("vehiculos")
          .select("id")
          .ilike("matricula", patrones.matricula)
          .limit(LIMITE_VEHICULOS_BUSQUEDA)
      : null,
    patrones.nombre
      ? supabase
          .from("vehiculos")
          .select("id, clientes!inner(nombre)")
          .ilike("clientes.nombre", patrones.nombre)
          .limit(LIMITE_VEHICULOS_BUSQUEDA)
      : null,
  ]);
  if (porMatricula?.error || porCliente?.error) {
    throw new Error("No se pudieron cargar las órdenes.");
  }
  const ids = new Set<string>();
  for (const v of porMatricula?.data ?? []) ids.add(v.id);
  for (const v of porCliente?.data ?? []) ids.add(v.id);
  return [...ids];
}

function FiltroEstados({ actual, q }: { actual: EstadoOrden | null; q: string }) {
  const opciones: { estado: EstadoOrden | null; etiqueta: string }[] = [
    { estado: null, etiqueta: "Todas" },
    ...ESTADOS.map((estado) => ({ estado, etiqueta: ETIQUETA_ESTADO[estado] })),
  ];
  return (
    <nav aria-label="Filtrar por estado">
      <ul className="flex flex-wrap gap-2">
        {opciones.map(({ estado, etiqueta }) => {
          const activo = estado === actual;
          return (
            <li key={estado ?? "todas"}>
              <Link
                href={hrefListadoOrdenes({ estado, q })}
                aria-current={activo ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium ${
                  activo
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                }`}
              >
                {etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default async function PaginaOrdenes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; estado?: string | string[] }>;
}) {
  const { q, estado: estadoParametro } = await searchParams;
  const texto = typeof q === "string" ? q : "";
  const estado = estadoDesdeParametro(estadoParametro);
  const patrones = patronesBusquedaOrden(texto);

  const supabase = await crearClienteServidor();

  let ordenes: FilaResumenOrden[] = [];
  const idsVehiculos = patrones ? await vehiculosCoincidentes(supabase, patrones) : null;
  if (idsVehiculos === null || idsVehiculos.length > 0) {
    let consulta = supabase
      .from("ordenes")
      .select(
        "id, estado, fecha_entrada, iva_porcentaje, lineas_orden(tipo, cantidad, precio_unitario_centimos), vehiculos(id, matricula, clientes(id, nombre))",
      )
      .order("fecha_entrada", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(LIMITE);
    if (estado) consulta = consulta.eq("estado", estado);
    if (idsVehiculos) consulta = consulta.in("vehiculo_id", idsVehiculos);
    const { data, error } = await consulta;
    if (error) throw new Error("No se pudieron cargar las órdenes.");
    ordenes = data;
  }

  const hayFiltro = patrones !== null || estado !== null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold md:text-2xl">Órdenes de trabajo</h1>
        <Link href="/ordenes/nueva" className={claseBotonPrimario}>
          Nueva orden
        </Link>
      </div>

      <FiltroEstados actual={estado} q={texto} />

      <Buscador
        ruta="/ordenes"
        ocultos={estado ? { estado } : undefined}
        valor={texto}
        etiqueta="Buscar órdenes"
        placeholder="Matrícula o nombre del cliente"
      />

      <ListaResponsive
        elementos={ordenes}
        columnas={COLUMNAS_LISTADO_ORDENES}
        clave={(o) => o.id}
        vacio={hayFiltro ? "Ninguna orden coincide con el filtro." : "Aún no hay órdenes."}
      />

      {ordenes.length === LIMITE && (
        <p className="text-sm text-slate-600">
          Se muestran las {LIMITE} órdenes más recientes. Usa el buscador o el filtro para afinar.
        </p>
      )}
    </section>
  );
}
