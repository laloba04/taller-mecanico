import type { Metadata } from "next";
import { FormularioAuth } from "./FormularioAuth";

export const metadata: Metadata = {
  title: "Entrar · Taller mecánico",
};

const MENSAJES_ERROR: Readonly<Record<string, string>> = {
  confirmacion:
    "No se pudo confirmar tu email. El enlace puede haber caducado: vuelve a registrarte o inicia sesión.",
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
  const avisoError =
    codigoError && Object.hasOwn(MENSAJES_ERROR, codigoError)
      ? MENSAJES_ERROR[codigoError]
      : undefined;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 p-4">
      <header className="text-center">
        <h1 className="text-2xl font-bold">Taller mecánico</h1>
        <p className="mt-1 text-slate-600">Gestiona clientes, vehículos y órdenes de trabajo.</p>
      </header>

      {avisoError && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {avisoError}
        </p>
      )}

      <FormularioAuth siguiente={siguiente} />
    </main>
  );
}
