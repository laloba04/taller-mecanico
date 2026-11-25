import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { esIdValido } from "@/lib/formularios";
import { formatearMatricula } from "@/lib/matricula";
import { crearClienteServidor } from "@/lib/supabase/server";
import { actualizarVehiculo } from "../../actions";
import { clientesParaSelector } from "../../clientesParaSelector";
import { FormularioVehiculo } from "../../FormularioVehiculo";

export const metadata: Metadata = { title: "Editar vehículo · Taller mecánico" };

export default async function PaginaEditarVehiculo({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!esIdValido(id)) notFound();

  const supabase = await crearClienteServidor();
  const { data: vehiculo, error } = await supabase
    .from("vehiculos")
    .select("id, cliente_id, matricula, marca, modelo, anio, kilometros")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("No se pudo cargar el vehículo.");
  if (!vehiculo) notFound();
  // Incluye siempre el cliente actual aunque quede fuera del límite del selector.
  const clientes = await clientesParaSelector(vehiculo.cliente_id);

  return (
    <section className="flex max-w-xl flex-col gap-4">
      <h1 className="text-xl font-bold md:text-2xl">
        Editar vehículo <span className="font-mono">{formatearMatricula(vehiculo.matricula)}</span>
      </h1>
      <FormularioVehiculo
        accion={actualizarVehiculo}
        clientes={clientes}
        id={vehiculo.id}
        valoresIniciales={{
          cliente_id: vehiculo.cliente_id,
          matricula: vehiculo.matricula,
          marca: vehiculo.marca ?? "",
          modelo: vehiculo.modelo ?? "",
          anio: vehiculo.anio === null ? "" : String(vehiculo.anio),
          kilometros: vehiculo.kilometros === null ? "" : String(vehiculo.kilometros),
        }}
        textoBoton="Guardar cambios"
        rutaCancelar={`/vehiculos/${vehiculo.id}`}
      />
    </section>
  );
}
