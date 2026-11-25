"use client";

import { useActionState, useState } from "react";
import { ESTADO_FORMULARIO_INICIAL, type EstadoFormulario } from "@/lib/formularios";
import { claseBotonPeligro, claseBotonPeligroSecundario, claseBotonSecundario } from "./estilos";

type Props = {
  accion: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  id: string;
  /** Texto del primer botón, p. ej. "Eliminar cliente". */
  texto: string;
  /** Aviso que se muestra antes de confirmar. */
  aviso: string;
};

/**
 * Borrado con confirmación en dos pasos dentro de la propia página (sin `window.confirm`).
 */
export function BotonEliminar({ accion, id, texto, aviso }: Props) {
  const [confirmando, setConfirmando] = useState(false);
  const [estado, accionFormulario, pendiente] = useActionState(accion, ESTADO_FORMULARIO_INICIAL);

  if (!confirmando) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className={claseBotonPeligroSecundario}
        >
          {texto}
        </button>
        {estado.error && (
          <p role="alert" className="text-sm text-red-700">
            {estado.error}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      action={accionFormulario}
      className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-3"
    >
      <input type="hidden" name="id" value={id} />
      <p className="text-sm text-red-900">{aviso}</p>
      {estado.error && (
        <p role="alert" className="text-sm font-medium text-red-800">
          {estado.error}
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" disabled={pendiente} className={claseBotonPeligro}>
          {pendiente ? "Eliminando…" : "Sí, eliminar"}
        </button>
        <button
          type="button"
          disabled={pendiente}
          onClick={() => setConfirmando(false)}
          className={claseBotonSecundario}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
