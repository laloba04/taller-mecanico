import Link from "next/link";
import { claseBotonPrimario } from "@/components/estilos";

export default function NoEncontrado() {
  return (
    <section className="flex flex-col items-start gap-3">
      <h1 className="text-xl font-bold md:text-2xl">No encontrado</h1>
      <p className="text-slate-700">Lo que buscas no existe o ya se ha eliminado.</p>
      <Link href="/panel" className={claseBotonPrimario}>
        Volver al panel
      </Link>
    </section>
  );
}
