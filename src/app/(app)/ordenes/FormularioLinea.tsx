"use client";

import { useActionState } from "react";
import { CampoFormulario, CampoSelector } from "@/components/CampoFormulario";
import { claseBotonPrimario } from "@/components/estilos";
import { ESTADO_FORMULARIO_INICIAL, type EstadoFormulario } from "@/lib/formularios";
import { DESCRIPCION_LINEA_MAXIMA, ETIQUETA_TIPO_LINEA, TIPOS_LINEA } from "@/lib/ordenes";

type Props = {
  accion: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  ordenId: string;
};

const INICIALES = { tipo: "pieza", descripcion: "", cantidad: "1", precio: "" };

/** Añade una línea (pieza o mano de obra) a la orden; se vacía al guardar. */
export function FormularioLinea({ accion, ordenId }: Props) {
  const [estado, accionFormulario, pendiente] = useActionState(accion, ESTADO_FORMULARIO_INICIAL);
  const valores = { ...INICIALES, ...estado.valores };
  const errores = estado.errores ?? {};

  return (
    <form
      action={accionFormulario}
      noValidate
      className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4"
    >
      <h3 className="font-semibold">Añadir línea</h3>
      <input type="hidden" name="orden_id" value={ordenId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoSelector
          id="linea-tipo"
          etiqueta="Tipo"
          name="tipo"
          required
          defaultValue={valores.tipo}
          error={errores.tipo}
        >
          {TIPOS_LINEA.map((tipo) => (
            <option key={tipo} value={tipo}>
              {ETIQUETA_TIPO_LINEA[tipo]}
            </option>
          ))}
        </CampoSelector>
        <CampoFormulario
          id="linea-descripcion"
          etiqueta="Descripción"
          name="descripcion"
          required
          maxLength={DESCRIPCION_LINEA_MAXIMA}
          autoComplete="off"
          defaultValue={valores.descripcion}
          error={errores.descripcion}
        />
        <CampoFormulario
          id="linea-cantidad"
          etiqueta="Cantidad (unidades u horas)"
          name="cantidad"
          required
          inputMode="decimal"
          maxLength={12}
          autoComplete="off"
          ayuda="Hasta 2 decimales, p. ej. 1,5."
          defaultValue={valores.cantidad}
          error={errores.cantidad}
        />
        <CampoFormulario
          id="linea-precio"
          etiqueta="Precio unitario sin IVA (€)"
          name="precio"
          required
          inputMode="decimal"
          maxLength={15}
          autoComplete="off"
          ayuda="En euros, p. ej. 45,90."
          defaultValue={valores.precio}
          error={errores.precio}
        />
      </div>

      {estado.error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {estado.error}
        </p>
      )}

      <button type="submit" disabled={pendiente} className={`${claseBotonPrimario} sm:self-start`}>
        {pendiente ? "Añadiendo…" : "Añadir línea"}
      </button>
    </form>
  );
}
