import { redirect } from "next/navigation";
import { RUTA_INICIO } from "@/lib/rutas";

export default function Inicio() {
  redirect(RUTA_INICIO);
}
