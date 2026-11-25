"use client";

import { claseBotonPrimario } from "@/components/estilos";

/**
 * Error inesperado al cargar una página de la app.
 * No muestra el mensaje ni la traza del error (D17).
 */
export default function ErrorApp({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="flex flex-col items-start gap-3">
      <h1 className="text-xl font-bold md:text-2xl">Algo ha fallado</h1>
      <p role="alert" className="text-slate-700">
        No se pudo cargar la información. Comprueba tu conexión e inténtalo de nuevo.
      </p>
      <button type="button" onClick={reset} className={claseBotonPrimario}>
        Reintentar
      </button>
    </section>
  );
}
