import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BotonEliminar } from "@/components/BotonEliminar";
import { Dato } from "@/components/Dato";
import { claseBotonSecundario, claseEnlace } from "@/components/estilos";
import { esIdValido } from "@/lib/formularios";
import { formatearMatricula } from "@/lib/matricula";
import { crearClienteServidor } from "@/lib/supabase/server";
import { eliminarVehiculo } from "../actions";

export const metadata: Metadata = { title: "Vehículo · Taller mecánico" };

const numero = new Intl.NumberFormat("es-ES", { useGrouping: true });

export default async function PaginaVehiculo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!esIdValido(id)) notFound();

  const supabase = await crearClienteServidor();
  const { data: vehiculo, error } = await supabase
    .from("vehiculos")
    .select("id, matricula, marca, modelo, anio, kilometros, clientes(id, nombre)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("No se pudo cargar el vehículo.");
  if (!vehiculo) notFound();

  const matricula = formatearMatricula(vehiculo.matricula);
  const descripcion = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(" ");

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/vehiculos" className={`${claseEnlace} text-sm`}>
          ← Vehículos
        </Link>
        <h1 className="font-mono text-xl font-bold md:text-2xl">{matricula}</h1>
        {descripcion && <p className="text-slate-700">{descripcion}</p>}
      </div>

      <dl className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <Dato etiqueta="Cliente">
          {vehiculo.clientes ? (
            <Link href={`/clientes/${vehiculo.clientes.id}`} className={claseEnlace}>
              {vehiculo.clientes.nombre}
            </Link>
          ) : (
            "—"
          )}
        </Dato>
        <Dato etiqueta="Marca">{vehiculo.marca ?? "—"}</Dato>
        <Dato etiqueta="Modelo">{vehiculo.modelo ?? "—"}</Dato>
        <Dato etiqueta="Año">{vehiculo.anio ?? "—"}</Dato>
        <Dato etiqueta="Kilómetros">
          {vehiculo.kilometros === null ? "—" : `${numero.format(vehiculo.kilometros)} km`}
        </Dato>
      </dl>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href={`/vehiculos/${vehiculo.id}/editar`} className={claseBotonSecundario}>
          Editar vehículo
        </Link>
      </div>

      <section className="flex flex-col gap-2" aria-labelledby="titulo-ordenes">
        <h2 id="titulo-ordenes" className="text-lg font-semibold">
          Órdenes de este vehículo
        </h2>
        <p className="rounded-md border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
          Próximamente.
        </p>
      </section>

      <section className="flex flex-col gap-2 border-t border-slate-200 pt-4">
        <h2 className="text-sm font-semibold text-slate-700">Zona peligrosa</h2>
        <div className="sm:max-w-md">
          <BotonEliminar
            accion={eliminarVehiculo}
            id={vehiculo.id}
            texto="Eliminar vehículo"
            aviso={`Se eliminará el vehículo ${matricula} y todas sus órdenes de trabajo. Esta acción no se puede deshacer.`}
          />
        </div>
      </section>
    </section>
  );
}
