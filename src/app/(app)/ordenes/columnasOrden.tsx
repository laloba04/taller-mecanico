import Link from "next/link";
import { EtiquetaEstado } from "@/components/EtiquetaEstado";
import { claseEnlace } from "@/components/estilos";
import type { ColumnaLista } from "@/components/ListaResponsive";
import { totalesOrdenSeguros, type LineaCalculo } from "@/lib/calculos";
import type { EstadoOrden } from "@/lib/estados";
import { formatEuro, formatFecha } from "@/lib/formato";
import { formatearMatricula } from "@/lib/matricula";

/** Columnas de órdenes que se piden a la BD para pintar listados con su total. */
export const SELECT_RESUMEN_ORDEN =
  "id, estado, fecha_entrada, iva_porcentaje, lineas_orden(tipo, cantidad, precio_unitario_centimos)";

export type FilaResumenOrden = {
  id: string;
  estado: EstadoOrden;
  fecha_entrada: string;
  iva_porcentaje: number;
  lineas_orden: LineaCalculo[];
  vehiculos?: {
    id: string;
    matricula: string;
    clientes: { id: string; nombre: string } | null;
  } | null;
};

const columnaEntrada: ColumnaLista<FilaResumenOrden> = {
  titulo: "Entrada",
  celda: (o) => (
    <Link href={`/ordenes/${o.id}`} className={claseEnlace} aria-label={`Orden del ${formatFecha(o.fecha_entrada)}`}>
      {formatFecha(o.fecha_entrada)}
    </Link>
  ),
};

const columnaEstado: ColumnaLista<FilaResumenOrden> = {
  titulo: "Estado",
  celda: (o) => <EtiquetaEstado estado={o.estado} />,
};

const columnaTotal: ColumnaLista<FilaResumenOrden> = {
  titulo: "Total",
  celda: (o) => {
    const totales = totalesOrdenSeguros(o.lineas_orden, o.iva_porcentaje);
    return (
      <span className="font-medium tabular-nums">{totales ? formatEuro(totales.total) : "—"}</span>
    );
  },
};

const columnaMatricula: ColumnaLista<FilaResumenOrden> = {
  titulo: "Matrícula",
  celda: (o) =>
    o.vehiculos ? (
      <Link href={`/vehiculos/${o.vehiculos.id}`} className={`${claseEnlace} font-mono`}>
        {formatearMatricula(o.vehiculos.matricula)}
      </Link>
    ) : (
      "—"
    ),
};

const columnaCliente: ColumnaLista<FilaResumenOrden> = {
  titulo: "Cliente",
  celda: (o) =>
    o.vehiculos?.clientes ? (
      <Link href={`/clientes/${o.vehiculos.clientes.id}`} className={claseEnlace}>
        {o.vehiculos.clientes.nombre}
      </Link>
    ) : (
      "—"
    ),
};

/** Listado general: entrada, matrícula, cliente, estado y total. */
export const COLUMNAS_LISTADO_ORDENES: ColumnaLista<FilaResumenOrden>[] = [
  columnaEntrada,
  columnaMatricula,
  columnaCliente,
  columnaEstado,
  columnaTotal,
];

/** Órdenes dentro de la ficha de un vehículo: entrada, estado y total. */
export const COLUMNAS_ORDENES_VEHICULO: ColumnaLista<FilaResumenOrden>[] = [
  columnaEntrada,
  columnaEstado,
  columnaTotal,
];
