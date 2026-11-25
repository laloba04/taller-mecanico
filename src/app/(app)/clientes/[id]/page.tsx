import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BotonEliminar } from "@/components/BotonEliminar";
import { Dato } from "@/components/Dato";
import { claseBotonPrimario, claseBotonSecundario, claseEnlace } from "@/components/estilos";
import { ListaResponsive, type ColumnaLista } from "@/components/ListaResponsive";
import { esIdValido } from "@/lib/formularios";
import { crearClienteServidor } from "@/lib/supabase/server";
import { eliminarCliente } from "../actions";

export const metadata: Metadata = { title: "Cliente · Taller mecánico" };

type FilaVehiculo = {
  id: string;
  matricula: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
};

const columnasVehiculos: ColumnaLista<FilaVehiculo>[] = [
  {
    titulo: "Matrícula",
    celda: (v) => (
      <Link href={`/vehiculos/${v.id}`} className={`${claseEnlace} font-mono`}>
        {v.matricula}
      </Link>
    ),
  },
  {
    titulo: "Vehículo",
    celda: (v) => [v.marca, v.modelo].filter(Boolean).join(" ") || "—",
  },
  { titulo: "Año", celda: (v) => v.anio ?? "—" },
];

export default async function PaginaCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!esIdValido(id)) notFound();

  const supabase = await crearClienteServidor();
  const [resultadoCliente, resultadoVehiculos] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nombre, telefono, email, notas")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("vehiculos")
      .select("id, matricula, marca, modelo, anio")
      .eq("cliente_id", id)
      .order("matricula"),
  ]);
  if (resultadoCliente.error || resultadoVehiculos.error) {
    throw new Error("No se pudo cargar el cliente.");
  }
  const cliente = resultadoCliente.data;
  if (!cliente) notFound();
  const vehiculos: FilaVehiculo[] = resultadoVehiculos.data;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/clientes" className={`${claseEnlace} text-sm`}>
          ← Clientes
        </Link>
        <h1 className="break-words text-xl font-bold md:text-2xl">{cliente.nombre}</h1>
      </div>

      <dl className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <Dato etiqueta="Teléfono">
          {cliente.telefono ? (
            <a href={`tel:${cliente.telefono}`} className={claseEnlace}>
              {cliente.telefono}
            </a>
          ) : (
            "—"
          )}
        </Dato>
        <Dato etiqueta="Email">
          {cliente.email ? (
            <a href={`mailto:${cliente.email}`} className={claseEnlace}>
              {cliente.email}
            </a>
          ) : (
            "—"
          )}
        </Dato>
        <div className="sm:col-span-2">
          <Dato etiqueta="Notas">
            <span className="whitespace-pre-line">{cliente.notas ?? "—"}</span>
          </Dato>
        </div>
      </dl>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href={`/clientes/${cliente.id}/editar`} className={claseBotonSecundario}>
          Editar cliente
        </Link>
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="titulo-vehiculos">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="titulo-vehiculos" className="text-lg font-semibold">
            Vehículos
          </h2>
          <Link href={`/vehiculos/nuevo?cliente=${cliente.id}`} className={claseBotonPrimario}>
            Añadir vehículo
          </Link>
        </div>
        <ListaResponsive
          elementos={vehiculos}
          columnas={columnasVehiculos}
          clave={(v) => v.id}
          vacio="Este cliente aún no tiene vehículos."
        />
      </section>

      <section className="flex flex-col gap-2 border-t border-slate-200 pt-4">
        <h2 className="text-sm font-semibold text-slate-700">Zona peligrosa</h2>
        <div className="sm:max-w-md">
          <BotonEliminar
            accion={eliminarCliente}
            id={cliente.id}
            texto="Eliminar cliente"
            aviso={`Se eliminará ${cliente.nombre} junto con sus ${vehiculos.length} vehículo(s) y todas sus órdenes de trabajo. Esta acción no se puede deshacer.`}
          />
        </div>
      </section>
    </section>
  );
}
