import { ETIQUETA_ESTADO, type EstadoOrden } from "@/lib/estados";

const CLASE_ESTADO: Readonly<Record<EstadoOrden, string>> = {
  recibido: "bg-slate-100 text-slate-800 ring-slate-300",
  en_reparacion: "bg-amber-100 text-amber-900 ring-amber-300",
  listo: "bg-emerald-100 text-emerald-900 ring-emerald-300",
  entregado: "bg-sky-100 text-sky-900 ring-sky-300",
};

/** Etiqueta de color con el estado de una orden, en español. */
export function EtiquetaEstado({ estado }: { estado: EstadoOrden }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ring-1 ring-inset ${CLASE_ESTADO[estado]}`}
    >
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}
