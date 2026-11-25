"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CampoAreaTexto, CampoFormulario } from "@/components/CampoFormulario";
import { claseBotonPrimario, claseBotonSecundario } from "@/components/estilos";
import { ESTADO_FORMULARIO_INICIAL, type EstadoFormulario } from "@/lib/formularios";

export type ValoresCliente = {
  nombre: string;
  telefono: string;
  email: string;
  notas: string;
};

type Props = {
  accion: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  /** Id del cliente si se está editando. */
  id?: string;
  valoresIniciales?: ValoresCliente;
  textoBoton: string;
  rutaCancelar: string;
};

const VACIO: ValoresCliente = { nombre: "", telefono: "", email: "", notas: "" };

/** Formulario de alta y edición de clientes. */
export function FormularioCliente({
  accion,
  id,
  valoresIniciales = VACIO,
  textoBoton,
  rutaCancelar,
}: Props) {
  const [estado, accionFormulario, pendiente] = useActionState(accion, ESTADO_FORMULARIO_INICIAL);
  const valores = { ...valoresIniciales, ...estado.valores };
  const errores = estado.errores ?? {};

  return (
    <form action={accionFormulario} noValidate className="flex flex-col gap-4">
      {id && <input type="hidden" name="id" value={id} />}

      <CampoFormulario
        id="cliente-nombre"
        etiqueta="Nombre"
        name="nombre"
        required
        maxLength={120}
        autoComplete="name"
        defaultValue={valores.nombre}
        error={errores.nombre}
      />
      <CampoFormulario
        id="cliente-telefono"
        etiqueta="Teléfono (opcional)"
        name="telefono"
        type="tel"
        inputMode="tel"
        maxLength={20}
        autoComplete="tel"
        defaultValue={valores.telefono}
        error={errores.telefono}
      />
      <CampoFormulario
        id="cliente-email"
        etiqueta="Email (opcional)"
        name="email"
        type="email"
        inputMode="email"
        maxLength={254}
        autoComplete="email"
        defaultValue={valores.email}
        error={errores.email}
      />
      <CampoAreaTexto
        id="cliente-notas"
        etiqueta="Notas (opcional)"
        name="notas"
        rows={3}
        maxLength={1000}
        autoComplete="off"
        defaultValue={valores.notas}
        error={errores.notas}
      />

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
