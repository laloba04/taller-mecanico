import type { Metadata } from "next";
import { Proximamente } from "@/components/Proximamente";

export const metadata: Metadata = { title: "Clientes · Taller mecánico" };

export default function PaginaClientes() {
  return <Proximamente titulo="Clientes" descripcion="Alta, edición y búsqueda de clientes." />;
}
