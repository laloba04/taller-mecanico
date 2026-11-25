/**
 * Estados de una orden de trabajo (D11). Solo avanzan, de uno en uno:
 * recibido → en_reparacion → listo → entregado. Sin saltos ni retrocesos.
 * La BD lo refuerza con el trigger de `20261125000000_transiciones_orden.sql`.
 */
import type { EstadoOrden } from "./supabase/tipos";

export type { EstadoOrden };

export const ESTADOS = ["recibido", "en_reparacion", "listo", "entregado"] as const satisfies
  readonly EstadoOrden[];

export const ETIQUETA_ESTADO: Readonly<Record<EstadoOrden, string>> = {
  recibido: "Recibido",
  en_reparacion: "En reparación",
  listo: "Listo para entregar",
  entregado: "Entregado",
};

export function esEstado(valor: unknown): valor is EstadoOrden {
  return typeof valor === "string" && (ESTADOS as readonly string[]).includes(valor);
}

/** Estado al que se puede pasar desde `estado`, o null si ya es el último. */
export function siguienteEstado(estado: EstadoOrden): EstadoOrden | null {
  const indice = ESTADOS.indexOf(estado);
  if (indice === -1) return null;
  return ESTADOS[indice + 1] ?? null;
}

/** True solo si `hasta` es el estado inmediatamente siguiente a `desde`. */
export function puedeTransicionar(desde: EstadoOrden, hasta: EstadoOrden): boolean {
  return esEstado(desde) && esEstado(hasta) && siguienteEstado(desde) === hasta;
}

/** Líneas, IVA y descripción se pueden modificar salvo en una orden entregada. */
export function esEditable(estado: EstadoOrden): boolean {
  return esEstado(estado) && estado !== "entregado";
}
