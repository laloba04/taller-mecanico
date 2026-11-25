import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BotonEliminar } from "@/components/BotonEliminar";
import { Dato } from "@/components/Dato";
import { EtiquetaEstado } from "@/components/EtiquetaEstado";
import { claseEnlace } from "@/components/estilos";
import { ListaResponsive, type ColumnaLista } from "@/components/ListaResponsive";
import { importeLineaSeguro, totalesOrdenSeguros } from "@/lib/calculos";
import { esEditable, siguienteEstado } from "@/lib/estados";
import { formatCantidad, formatEuro, formatFecha } from "@/lib/formato";
import { esIdValido } from "@/lib/formularios";
import { formatearMatricula } from "@/lib/matricula";
import { ETIQUETA_TIPO_LINEA } from "@/lib/ordenes";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { TipoLinea } from "@/lib/supabase/tipos";
import {
  actualizarOrden,
  anadirLinea,
  avanzarEstado,
  eliminarLinea,
  eliminarOrden,
} from "../actions";
import { BotonAvanzarEstado } from "../BotonAvanzarEstado";
import { FormularioLinea } from "../FormularioLinea";
import { FormularioOrden } from "../FormularioOrden";

export const metadata: Metadata = { title: "Orden de trabajo · Taller mecánico" };

type FilaLinea = {
  id: string;
  tipo: TipoLinea;
  descripcion: string;
  cantidad: number;
  precio_unitario_centimos: number;
};

function importeTexto(linea: FilaLinea): string {
  const importe = importeLineaSeguro(linea.cantidad, linea.precio_unitario_centimos);
  return importe === null ? "—" : formatEuro(importe);
}

function columnasLineas(editable: boolean): ColumnaLista<FilaLinea>[] {
  const columnas: ColumnaLista<FilaLinea>[] = [
    { titulo: "Tipo", celda: (l) => ETIQUETA_TIPO_LINEA[l.tipo] },
    { titulo: "Descripción", celda: (l) => l.descripcion },
    { titulo: "Cantidad", celda: (l) => <span className="tabular-nums">{formatCantidad(l.cantidad)}</span> },
    {
      titulo: "Precio unitario",
      celda: (l) => <span className="tabular-nums">{formatEuro(l.precio_unitario_centimos)}</span>,
    },
    {
      titulo: "Importe",
      celda: (l) => <span className="font-medium tabular-nums">{importeTexto(l)}</span>,
    },
  ];
  if (editable) {
    columnas.push({
      titulo: "Acciones",
      celda: (l) => (
        <BotonEliminar
          accion={eliminarLinea}
          id={l.id}
          texto="Eliminar línea"
          aviso={`Se eliminará la línea «${l.descripcion}».`}
        />
      ),
    });
  }
  return columnas;
}

function FilaTotal({
  etiqueta,
  centimos,
  destacado = false,
}: {
  etiqueta: string;
  centimos: number;
  destacado?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${
        destacado ? "border-t border-slate-200 pt-2 text-lg font-bold" : ""
      }`}
    >
      <dt className={destacado ? "" : "text-slate-600"}>{etiqueta}</dt>
      <dd className="tabular-nums">{formatEuro(centimos)}</dd>
    </div>
  );
}

export default async function PaginaOrden({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!esIdValido(id)) notFound();

  const supabase = await crearClienteServidor();
  const [resultadoOrden, resultadoLineas] = await Promise.all([
    supabase
      .from("ordenes")
      .select(
        "id, estado, descripcion, iva_porcentaje, fecha_entrada, fecha_entrega, vehiculos(id, matricula, marca, modelo, clientes(id, nombre))",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("lineas_orden")
      .select("id, tipo, descripcion, cantidad, precio_unitario_centimos")
      .eq("orden_id", id)
      .order("created_at")
      .order("id"),
  ]);
  if (resultadoOrden.error || resultadoLineas.error) {
    throw new Error("No se pudo cargar la orden.");
  }
  const orden = resultadoOrden.data;
  if (!orden) notFound();
  const lineas: FilaLinea[] = resultadoLineas.data;

  const editable = esEditable(orden.estado);
  const siguiente = siguienteEstado(orden.estado);
  const totales = totalesOrdenSeguros(lineas, orden.iva_porcentaje);
  const vehiculo = orden.vehiculos;
  const matricula = vehiculo ? formatearMatricula(vehiculo.matricula) : "";

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/ordenes" className={`${claseEnlace} text-sm`}>
          ← Órdenes
        </Link>
        <h1 className="text-xl font-bold md:text-2xl">
          Orden del {formatFecha(orden.fecha_entrada)}
          {matricula && <span className="font-mono"> · {matricula}</span>}
        </h1>
      </div>

      <dl className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <Dato etiqueta="Vehículo">
          {vehiculo ? (
            <Link href={`/vehiculos/${vehiculo.id}`} className={claseEnlace}>
              <span className="font-mono">{matricula}</span>
              {[vehiculo.marca, vehiculo.modelo].some(Boolean) &&
                ` · ${[vehiculo.marca, vehiculo.modelo].filter(Boolean).join(" ")}`}
            </Link>
          ) : (
            "—"
          )}
        </Dato>
        <Dato etiqueta="Cliente">
          {vehiculo?.clientes ? (
            <Link href={`/clientes/${vehiculo.clientes.id}`} className={claseEnlace}>
              {vehiculo.clientes.nombre}
            </Link>
          ) : (
            "—"
          )}
        </Dato>
        <Dato etiqueta="Fecha de entrada">{formatFecha(orden.fecha_entrada)}</Dato>
        <Dato etiqueta="Fecha de entrega">{formatFecha(orden.fecha_entrega)}</Dato>
        <Dato etiqueta="Estado">
          <EtiquetaEstado estado={orden.estado} />
        </Dato>
        {!editable && (
          <Dato etiqueta="Descripción">
            <span className="whitespace-pre-line">{orden.descripcion ?? "—"}</span>
          </Dato>
        )}
      </dl>

      {siguiente && (
        <div className="sm:max-w-md">
          <BotonAvanzarEstado
            accion={avanzarEstado}
            id={orden.id}
            estado={orden.estado}
            siguiente={siguiente}
          />
        </div>
      )}

      {!editable && (
        <p
          role="status"
          className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sm font-medium text-sky-900"
        >
          Orden entregada: no se puede modificar.
        </p>
      )}

      <section className="flex flex-col gap-3" aria-labelledby="titulo-lineas">
        <h2 id="titulo-lineas" className="text-lg font-semibold">
          Piezas y mano de obra
        </h2>
        <ListaResponsive
          elementos={lineas}
          columnas={columnasLineas(editable)}
          clave={(l) => l.id}
          vacio="Esta orden aún no tiene líneas."
        />
        {editable && <FormularioLinea accion={anadirLinea} ordenId={orden.id} />}
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="titulo-totales">
        <h2 id="titulo-totales" className="text-lg font-semibold">
          Totales
        </h2>
        {totales ? (
          <dl className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 sm:max-w-md">
            <FilaTotal etiqueta="Piezas" centimos={totales.piezas} />
            <FilaTotal etiqueta="Mano de obra" centimos={totales.manoObra} />
            <FilaTotal etiqueta="Base imponible" centimos={totales.baseImponible} />
            <FilaTotal etiqueta={`IVA (${orden.iva_porcentaje} %)`} centimos={totales.iva} />
            <FilaTotal etiqueta="Total" centimos={totales.total} destacado />
          </dl>
        ) : (
          <p role="alert" className="text-sm text-red-700">
            No se pudieron calcular los totales: revisa las líneas de la orden.
          </p>
        )}
      </section>

      {editable && (
        <section className="flex flex-col gap-3" aria-labelledby="titulo-editar">
          <h2 id="titulo-editar" className="text-lg font-semibold">
            Descripción e IVA
          </h2>
          <div className="sm:max-w-xl">
            <FormularioOrden
              accion={actualizarOrden}
              id={orden.id}
              valoresIniciales={{
                vehiculo_id: "",
                descripcion: orden.descripcion ?? "",
                iva_porcentaje: String(orden.iva_porcentaje),
              }}
              textoBoton="Guardar cambios"
            />
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2 border-t border-slate-200 pt-4">
        <h2 className="text-sm font-semibold text-slate-700">Zona peligrosa</h2>
        <div className="sm:max-w-md">
          <BotonEliminar
            accion={eliminarOrden}
            id={orden.id}
            texto="Eliminar orden"
            aviso="Se eliminará la orden y todas sus líneas. Esta acción no se puede deshacer."
          />
        </div>
      </section>
    </section>
  );
}
