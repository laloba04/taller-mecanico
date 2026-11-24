import type { Metadata } from "next";
import { Proximamente } from "@/components/Proximamente";

export const metadata: Metadata = { title: "Órdenes · Taller mecánico" };

export default function PaginaOrdenes() {
  return (
    <Proximamente
      titulo="Órdenes de trabajo"
      descripcion="Órdenes con su estado, piezas, mano de obra e IVA."
    />
  );
}
