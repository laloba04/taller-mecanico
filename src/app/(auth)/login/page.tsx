import type { Metadata } from "next";
import { ERROR_CONFIRMACION, ERROR_CONFIRMADO_OTRO_NAVEGADOR } from "@/lib/confirmacion";
import { FormularioAuth } from "./FormularioAuth";

export const metadata: Metadata = {
  title: "Entrar · Taller mecánico",
};

type Aviso = { texto: string; tipo: "error" | "info" };

const AVISOS: Readonly<Record<string, Aviso>> = {
  [ERROR_CONFIRMACION]: {
    texto:
      "No se pudo confirmar tu email con este enlace (puede haber caducado o ya se usó). Prueba a iniciar sesión; si no puedes, vuelve a registrarte.",
    tipo: "error",
  },
  [ERROR_CONFIRMADO_OTRO_NAVEGADOR]: {
    texto: "Tu email está confirmado. Inicia sesión con tu contraseña.",
    tipo: "info",
  },
};

const CLASES_AVISO: Readonly<Record<Aviso["tipo"], string>> = {
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-green-200 bg-green-50 text-green-800",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function primerValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function PaginaLogin({ searchParams }: Props) {
  const parametros = await searchParams;
  const siguiente = primerValor(parametros.siguiente) ?? "";
  const codigoError = primerValor(parametros.error);
  const aviso =
    codigoError && Object.hasOwn(AVISOS, codigoError) ? AVISOS[codigoError] : undefined;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 p-4">
      <header className="text-center">
        <h1 className="text-2xl font-bold">Taller mecánico</h1>
        <p className="mt-1 text-slate-600">Gestiona clientes, vehículos y órdenes de trabajo.</p>
      </header>

      {aviso && (
        <p
          role={aviso.tipo === "error" ? "alert" : "status"}
          className={`rounded-md border p-3 text-sm ${CLASES_AVISO[aviso.tipo]}`}
        >
          {aviso.texto}
        </p>
      )}

      <FormularioAuth siguiente={siguiente} />
    </main>
  );
}
