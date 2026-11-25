import type { Metadata } from "next";
import Link from "next/link";
import { claseBotonPrimario } from "@/components/estilos";
import { esIdValido } from "@/lib/formularios";
import { IVA_POR_DEFECTO } from "@/lib/ordenes";
import { crearOrden } from "../actions";
import { FormularioOrden } from "../FormularioOrden";
import { vehiculosParaSelector } from "../vehiculosParaSelector";

export const metadata: Metadata = { title: "Nueva orden · Taller mecánico" };

export default async function PaginaNuevaOrden({
  searchParams,
}: {
  searchParams: Promise<{ vehiculo?: string | string[] }>;
}) {
  const { vehiculo } = await searchParams;
  const idPedido = esIdValido(vehiculo) ? vehiculo : undefined;
  const vehiculos = await vehiculosParaSelector(idPedido);

  if (vehiculos.length === 0) {
    return (
      <section className="flex max-w-xl flex-col items-start gap-4">
        <h1 className="text-xl font-bold md:text-2xl">Nueva orden de trabajo</h1>
        <p className="text-slate-700">
          Para abrir una orden primero necesitas dar de alta el vehículo.
        </p>
        <Link href="/vehiculos/nuevo" className={claseBotonPrimario}>
          Crear un vehículo
        </Link>
      </section>
    );
  }

  // Solo se preselecciona si el id es válido y el vehículo es del usuario (RLS).
  const preseleccionado = idPedido && vehiculos.some((v) => v.id === idPedido) ? idPedido : "";

  return (
    <section className="flex max-w-xl flex-col gap-4">
      <h1 className="text-xl font-bold md:text-2xl">Nueva orden de trabajo</h1>
      <FormularioOrden
        accion={crearOrden}
        vehiculos={vehiculos}
        valoresIniciales={{
          vehiculo_id: preseleccionado,
          descripcion: "",
          iva_porcentaje: String(IVA_POR_DEFECTO),
        }}
        textoBoton="Crear orden"
        rutaCancelar={preseleccionado ? `/vehiculos/${preseleccionado}` : "/ordenes"}
      />
    </section>
  );
}
