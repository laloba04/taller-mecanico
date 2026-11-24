import type { Metadata } from "next";
import { Proximamente } from "@/components/Proximamente";

export const metadata: Metadata = { title: "Panel · Taller mecánico" };

export default function PaginaPanel() {
  return (
    <Proximamente
      titulo="Panel"
      descripcion="Aquí verás el resumen del taller: órdenes abiertas, listas para entregar y facturación."
    />
  );
}
