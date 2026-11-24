import type { Metadata } from "next";
import { Proximamente } from "@/components/Proximamente";

export const metadata: Metadata = { title: "Historial · Taller mecánico" };

export default function PaginaHistorial() {
  return (
    <Proximamente
      titulo="Historial"
      descripcion="Busca por matrícula para ver todas las reparaciones de un vehículo."
    />
  );
}
