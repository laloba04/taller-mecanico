"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CampoFormulario, CampoSelector } from "@/components/CampoFormulario";
import { claseBotonPrimario, claseBotonSecundario } from "@/components/estilos";
import { ESTADO_FORMULARIO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

export type ValoresVehiculo = {
  cliente_id: string;
  matricula: string;
  marca: string;
  modelo: string;
  anio: string;
  kilometros: string;
};

export type OpcionCliente = { id: string; nombre: string };

type Props = {
  accion: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  clientes: readonly OpcionCliente[];
  /** Id del vehículo si se está editando. */
  id?: string;
  valoresIniciales: ValoresVehiculo;
  textoBoton: string;
  rutaCancelar: string;
};

/** Formulario de alta y edición de vehículos. */
export function FormularioVehiculo({
  accion,
  clientes,
  id,
  valoresIniciales,
  textoBoton,
  rutaCancelar,
}: Props) {
  const [estado, accionFormulario, pendiente] = useActionState(accion, ESTADO_FORMULARIO_INICIAL);
  const valores = { ...valoresIniciales, ...estado.valores };
  const errores = estado.errores ?? {};

  return (
    <form action={accionFormulario} noValidate className="flex flex-col gap-4">
      {id && <input type="hidden" name="id" value={id} />}

      <CampoSelector
        id="vehiculo-cliente"
        etiqueta="Cliente"
        name="cliente_id"
        required
        defaultValue={valores.cliente_id}
        error={errores.cliente_id}
      >
        <option value="">Elige un cliente…</option>
        {clientes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </CampoSelector>
      <CampoFormulario
        id="vehiculo-matricula"
        etiqueta="Matrícula"
        name="matricula"
        required
        maxLength={20}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        ayuda="Puedes escribirla con espacios o guiones; se guarda sin ellos y en mayúsculas."
        defaultValue={valores.matricula}
        error={errores.matricula}
        className="font-mono uppercase"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoFormulario
          id="vehiculo-marca"
          etiqueta="Marca (opcional)"
          name="marca"
          maxLength={60}
          autoComplete="off"
          defaultValue={valores.marca}
          error={errores.marca}
        />
        <CampoFormulario
          id="vehiculo-modelo"
          etiqueta="Modelo (opcional)"
          name="modelo"
          maxLength={60}
          autoComplete="off"
          defaultValue={valores.modelo}
          error={errores.modelo}
        />
        <CampoFormulario
          id="vehiculo-anio"
          etiqueta="Año (opcional)"
          name="anio"
          inputMode="numeric"
          maxLength={4}
          autoComplete="off"
          defaultValue={valores.anio}
          error={errores.anio}
        />
        <CampoFormulario
          id="vehiculo-kilometros"
          etiqueta="Kilómetros (opcional)"
          name="kilometros"
          inputMode="numeric"
          maxLength={12}
          autoComplete="off"
          defaultValue={valores.kilometros}
          error={errores.kilometros}
        />
      </div>

      {estado.error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {estado.error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" disabled={pendiente} className={claseBotonPrimario}>
          {pendiente ? "Guardando…" : textoBoton}
        </button>
        <Link href={rutaCancelar} className={claseBotonSecundario}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
