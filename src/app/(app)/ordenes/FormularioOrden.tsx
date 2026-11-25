"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CampoAreaTexto, CampoSelector } from "@/components/CampoFormulario";
import { claseBotonPrimario, claseBotonSecundario } from "@/components/estilos";
import { ESTADO_FORMULARIO_INICIAL, type EstadoFormulario } from "@/lib/formularios";
import { DESCRIPCION_ORDEN_MAXIMA, IVAS_DISPONIBLES } from "@/lib/ordenes";

export type OpcionVehiculo = { id: string; etiqueta: string };

export type ValoresOrden = {
  vehiculo_id: string;
  descripcion: string;
  iva_porcentaje: string;
};

type Props = {
  accion: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  /** Si se indica, se muestra el selector de vehículo (alta). */
  vehiculos?: readonly OpcionVehiculo[];
  /** Id de la orden si se está editando. */
  id?: string;
  valoresIniciales: ValoresOrden;
  textoBoton: string;
  rutaCancelar?: string;
};

/** Alta de orden (vehículo, descripción, IVA) y edición de descripción e IVA. */
export function FormularioOrden({
  accion,
  vehiculos,
  id,
  valoresIniciales,
  textoBoton,
  rutaCancelar,
}: Props) {
  const [estado, accionFormulario, pendiente] = useActionState(accion, ESTADO_FORMULARIO_INICIAL);
  const valores = { ...valoresIniciales, ...estado.valores };
  const errores = estado.errores ?? {};
  const prefijo = id ? "orden-editar" : "orden-nueva";

  // Si la orden tiene un IVA fuera de la lista (p. ej. 7 %), se conserva como opción.
  const ivaActual = Number(valores.iva_porcentaje);
  const ivas: readonly number[] =
    Number.isInteger(ivaActual) && !(IVAS_DISPONIBLES as readonly number[]).includes(ivaActual)
      ? [...IVAS_DISPONIBLES, ivaActual]
      : IVAS_DISPONIBLES;

  return (
    <form action={accionFormulario} noValidate className="flex flex-col gap-4">
      {id && <input type="hidden" name="id" value={id} />}

      {vehiculos && (
        <CampoSelector
          id={`${prefijo}-vehiculo`}
          etiqueta="Vehículo"
          name="vehiculo_id"
          required
          defaultValue={valores.vehiculo_id}
          error={errores.vehiculo_id}
        >
          <option value="">Elige un vehículo…</option>
          {vehiculos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.etiqueta}
            </option>
          ))}
        </CampoSelector>
      )}
      <CampoAreaTexto
        id={`${prefijo}-descripcion`}
        etiqueta="Descripción del trabajo (opcional)"
        name="descripcion"
        rows={3}
        maxLength={DESCRIPCION_ORDEN_MAXIMA}
        autoComplete="off"
        defaultValue={valores.descripcion}
        error={errores.descripcion}
      />
      <CampoSelector
        id={`${prefijo}-iva`}
        etiqueta="IVA"
        name="iva_porcentaje"
        required
        defaultValue={valores.iva_porcentaje}
        error={errores.iva_porcentaje}
      >
        {ivas.map((iva) => (
          <option key={iva} value={String(iva)}>
            {iva} %
          </option>
        ))}
      </CampoSelector>

      {estado.error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {estado.error}
        </p>
      )}
      {estado.exito && !pendiente && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          {estado.exito}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" disabled={pendiente} className={claseBotonPrimario}>
          {pendiente ? "Guardando…" : textoBoton}
        </button>
        {rutaCancelar && (
          <Link href={rutaCancelar} className={claseBotonSecundario}>
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
