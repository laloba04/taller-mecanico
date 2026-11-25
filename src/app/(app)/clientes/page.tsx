import type { Metadata } from "next";
import Link from "next/link";
import { Buscador } from "@/components/Buscador";
import { claseBotonPrimario, claseEnlace } from "@/components/estilos";
import { ListaResponsive, type ColumnaLista } from "@/components/ListaResponsive";
import { filtroOrIlike, patronBusqueda } from "@/lib/busqueda";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Clientes · Taller mecánico" };

const LIMITE = 100;

type FilaCliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  vehiculos: { count: number }[];
};

const columnas: ColumnaLista<FilaCliente>[] = [
  {
    titulo: "Nombre",
    celda: (c) => (
      <Link href={`/clientes/${c.id}`} className={claseEnlace}>
        {c.nombre}
      </Link>
    ),
  },
  {
    titulo: "Teléfono",
    celda: (c) =>
      c.telefono ? (
        <a href={`tel:${c.telefono}`} className={claseEnlace}>
          {c.telefono}
        </a>
      ) : (
        "—"
      ),
  },
  { titulo: "Email", celda: (c) => c.email ?? "—" },
  { titulo: "Vehículos", celda: (c) => c.vehiculos[0]?.count ?? 0 },
];

export default async function PaginaClientes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const texto = typeof q === "string" ? q : "";
  const patron = patronBusqueda(texto);

  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("clientes")
    .select("id, nombre, telefono, email, vehiculos(count)")
    .order("nombre")
    .limit(LIMITE);
  if (patron) consulta = consulta.or(filtroOrIlike(["nombre", "telefono", "email"], patron));
  const { data, error } = await consulta;
  if (error) throw new Error("No se pudieron cargar los clientes.");

  const clientes: FilaCliente[] = data;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold md:text-2xl">Clientes</h1>
        <Link href="/clientes/nuevo" className={claseBotonPrimario}>
          Nuevo cliente
        </Link>
      </div>

      <Buscador
        ruta="/clientes"
        valor={texto}
        etiqueta="Buscar clientes"
        placeholder="Nombre, teléfono o email"
      />

      <ListaResponsive
        elementos={clientes}
        columnas={columnas}
        clave={(c) => c.id}
        vacio={patron ? "Ningún cliente coincide con la búsqueda." : "Aún no hay clientes."}
      />

      {clientes.length === LIMITE && (
        <p className="text-sm text-slate-600">
          Se muestran los primeros {LIMITE} clientes. Usa el buscador para afinar.
        </p>
      )}
    </section>
  );
}
