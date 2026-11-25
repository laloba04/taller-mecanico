import type { Metadata } from "next";
import { crearCliente } from "../actions";
import { FormularioCliente } from "../FormularioCliente";

export const metadata: Metadata = { title: "Nuevo cliente · Taller mecánico" };

export default function PaginaNuevoCliente() {
  return (
    <section className="flex max-w-xl flex-col gap-4">
      <h1 className="text-xl font-bold md:text-2xl">Nuevo cliente</h1>
      <FormularioCliente accion={crearCliente} textoBoton="Crear cliente" rutaCancelar="/clientes" />
    </section>
  );
}
