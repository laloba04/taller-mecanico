import type { Metadata } from "next";
import Link from "next/link";
import { Buscador } from "@/components/Buscador";
import { claseBotonPrimario, claseEnlace } from "@/components/estilos";
import { ListaResponsive, type ColumnaLista } from "@/components/ListaResponsive";
import { formatearMatricula } from "@/lib/matricula";
import { crearClienteServidor } from "@/lib/supabase/server";
import { filtroVehiculos } from "@/lib/vehiculos";

export const metadata: Metadata = { title: "Vehículos · Taller mecánico" };

const LIMITE = 100;

type FilaVehiculo = {
  id: string;
  matricula: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  clientes: { id: string; nombre: string } | null;
};

const columnas: ColumnaLista<FilaVehiculo>[] = [
  {
    titulo: "Matrícula",
    celda: (v) => (
      <Link href={`/vehiculos/${v.id}`} className={`${claseEnlace} font-mono`}>
        {formatearMatricula(v.matricula)}
      </Link>
    ),
  },
  {
    titulo: "Marca y modelo",
    celda: (v) => [v.marca, v.modelo].filter(Boolean).join(" ") || "—",
  },
  {
    titulo: "Cliente",
    celda: (v) =>
      v.clientes ? (
        <Link href={`/clientes/${v.clientes.id}`} className={claseEnlace}>
          {v.clientes.nombre}
        </Link>
      ) : (
        "—"
      ),
  },
  { titulo: "Año", celda: (v) => v.anio ?? "—" },
];

export default async function PaginaVehiculos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const texto = typeof q === "string" ? q : "";
  const filtro = filtroVehiculos(texto);

  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("vehiculos")
    .select("id, matricula, marca, modelo, anio, clientes(id, nombre)")
    .order("matricula")
    .limit(LIMITE);
  if (filtro) consulta = consulta.or(filtro);
  const { data, error } = await consulta;
  if (error) throw new Error("No se pudieron cargar los vehículos.");

  const vehiculos: FilaVehiculo[] = data;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold md:text-2xl">Vehículos</h1>
        <Link href="/vehiculos/nuevo" className={claseBotonPrimario}>
          Nuevo vehículo
        </Link>
      </div>

      <Buscador
        ruta="/vehiculos"
        valor={texto}
        etiqueta="Buscar vehículos"
        placeholder="Matrícula, marca o modelo"
      />

      <ListaResponsive
        elementos={vehiculos}
        columnas={columnas}
        clave={(v) => v.id}
        vacio={filtro ? "Ningún vehículo coincide con la búsqueda." : "Aún no hay vehículos."}
      />

      {vehiculos.length === LIMITE && (
        <p className="text-sm text-slate-600">
          Se muestran los primeros {LIMITE} vehículos. Usa el buscador para afinar.
        </p>
      )}
    </section>
  );
}
