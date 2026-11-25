import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { esIdValido } from "@/lib/formularios";
import { crearClienteServidor } from "@/lib/supabase/server";
import { actualizarCliente } from "../../actions";
import { FormularioCliente } from "../../FormularioCliente";

export const metadata: Metadata = { title: "Editar cliente · Taller mecánico" };

export default async function PaginaEditarCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!esIdValido(id)) notFound();

  const supabase = await crearClienteServidor();
  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("id, nombre, telefono, email, notas")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("No se pudo cargar el cliente.");
  if (!cliente) notFound();

  return (
    <section className="flex max-w-xl flex-col gap-4">
      <h1 className="text-xl font-bold md:text-2xl">Editar cliente</h1>
      <FormularioCliente
        accion={actualizarCliente}
        id={cliente.id}
        valoresIniciales={{
          nombre: cliente.nombre,
          telefono: cliente.telefono ?? "",
          email: cliente.email ?? "",
          notas: cliente.notas ?? "",
        }}
        textoBoton="Guardar cambios"
        rutaCancelar={`/clientes/${cliente.id}`}
      />
    </section>
  );
}
