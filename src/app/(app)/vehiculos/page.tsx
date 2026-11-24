import type { Metadata } from "next";
import { Proximamente } from "@/components/Proximamente";

export const metadata: Metadata = { title: "Vehículos · Taller mecánico" };

export default function PaginaVehiculos() {
  return (
    <Proximamente titulo="Vehículos" descripcion="Vehículos de cada cliente, con su matrícula." />
  );
}
