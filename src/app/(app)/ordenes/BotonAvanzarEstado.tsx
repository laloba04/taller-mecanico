"use client";

import { useActionState } from "react";
import { claseBotonPrimario } from "@/components/estilos";
import { ETIQUETA_ESTADO, type EstadoOrden } from "@/lib/estados";
import { ESTADO_FORMULARIO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

type Props = {
  accion: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  id: string;
  /** Estado que ve el usuario; la acción solo actualiza si sigue siendo este. */
  estado: EstadoOrden;
  siguiente: EstadoOrden;
};

/** Botón "Pasar a <siguiente>" con el error de la acción, si lo hay. */
export function BotonAvanzarEstado({ accion, id, estado, siguiente }: Props) {
  const [resultado, accionFormulario, pendiente] = useActionState(
    accion,
    ESTADO_FORMULARIO_INICIAL,
  );

  return (
    <form action={accionFormulario} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="estado" value={estado} />
      <button type="submit" disabled={pendiente} className={claseBotonPrimario}>
        {pendiente ? "Guardando…" : `Pasar a «${ETIQUETA_ESTADO[siguiente]}»`}
      </button>
      {resultado.error && (
        <p role="alert" className="text-sm text-red-700">
          {resultado.error}
        </p>
      )}
    </form>
  );
}
