import type { Metadata } from "next";
import Link from "next/link";
import { claseBotonPrimario } from "@/components/estilos";
import { esIdValido } from "@/lib/formularios";
import { crearVehiculo } from "../actions";
import { clientesParaSelector } from "../clientesParaSelector";
import { FormularioVehiculo } from "../FormularioVehiculo";

export const metadata: Metadata = { title: "Nuevo vehículo · Taller mecánico" };

export default async function PaginaNuevoVehiculo({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string | string[] }>;
}) {
  const { cliente } = await searchParams;
  const clientes = await clientesParaSelector();

  if (clientes.length === 0) {
    return (
      <section className="flex max-w-xl flex-col items-start gap-4">
        <h1 className="text-xl font-bold md:text-2xl">Nuevo vehículo</h1>
        <p className="text-slate-700">
          Para dar de alta un vehículo primero necesitas un cliente al que asignarlo.
        </p>
        <Link href="/clientes/nuevo" className={claseBotonPrimario}>
          Crear un cliente
        </Link>
      </section>
    );
  }

  // Solo se preselecciona si el id es válido y pertenece a un cliente del usuario.
  const preseleccionado =
    esIdValido(cliente) && clientes.some((c) => c.id === cliente) ? cliente : "";

  return (
    <section className="flex max-w-xl flex-col gap-4">
      <h1 className="text-xl font-bold md:text-2xl">Nuevo vehículo</h1>
      <FormularioVehiculo
        accion={crearVehiculo}
        clientes={clientes}
        valoresIniciales={{
          cliente_id: preseleccionado,
          matricula: "",
          marca: "",
          modelo: "",
          anio: "",
          kilometros: "",
        }}
        textoBoton="Crear vehículo"
        rutaCancelar={preseleccionado ? `/clientes/${preseleccionado}` : "/vehiculos"}
      />
    </section>
  );
}
