"use client";

import { useActionState, useState, type InputHTMLAttributes } from "react";
import { iniciarSesion, registrarse, type EstadoFormularioAuth } from "./actions";

type Modo = "entrar" | "registro";

const estadoInicial: EstadoFormularioAuth = {};

const claseInput =
  "min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20";

function Campo({
  id,
  etiqueta,
  error,
  ...props
}: {
  id: string;
  etiqueta: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const idError = `${id}-error`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {etiqueta}
      </label>
      <input
        id={id}
        className={claseInput}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
        {...props}
      />
      {error && (
        <p id={idError} role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormularioAuth({ siguiente }: { siguiente: string }) {
  const [modo, setModo] = useState<Modo>("entrar");
  const [estadoLogin, accionLogin, entrando] = useActionState(iniciarSesion, estadoInicial);
  const [estadoRegistro, accionRegistro, registrando] = useActionState(registrarse, estadoInicial);

  const esRegistro = modo === "registro";
  const estado = esRegistro ? estadoRegistro : estadoLogin;
  const pendiente = esRegistro ? registrando : entrando;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div role="tablist" aria-label="Modo de acceso" className="mb-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          role="tab"
          aria-selected={!esRegistro}
          onClick={() => setModo("entrar")}
          className={`min-h-11 rounded-md px-3 font-medium ${
            !esRegistro ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={esRegistro}
          onClick={() => setModo("registro")}
          className={`min-h-11 rounded-md px-3 font-medium ${
            esRegistro ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      {esRegistro && estadoRegistro.exito ? (
        <p role="status" className="rounded-md border border-green-200 bg-green-50 p-3 text-green-800">
          {estadoRegistro.exito}
        </p>
      ) : (
        <form
          key={modo}
          action={esRegistro ? accionRegistro : accionLogin}
          noValidate
          className="flex flex-col gap-4"
        >
          {!esRegistro && <input type="hidden" name="siguiente" value={siguiente} />}

          <Campo
            id={`${modo}-email`}
            etiqueta="Email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            defaultValue={estado.email ?? ""}
            error={estado.errores?.email}
          />
          <Campo
            id={`${modo}-password`}
            etiqueta="Contraseña"
            name="password"
            type="password"
            autoComplete={esRegistro ? "new-password" : "current-password"}
            required
            minLength={esRegistro ? 8 : undefined}
            error={estado.errores?.password}
          />
          {esRegistro && (
            <Campo
              id="registro-confirmacion"
              etiqueta="Repite la contraseña"
              name="confirmacion"
              type="password"
              autoComplete="new-password"
              required
              error={estado.errores?.confirmacion}
            />
          )}

          {estado.error && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {estado.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pendiente}
            className="min-h-11 rounded-md bg-slate-900 px-4 font-semibold text-white disabled:opacity-60"
          >
            {pendiente
              ? esRegistro
                ? "Creando cuenta…"
                : "Entrando…"
              : esRegistro
                ? "Crear cuenta"
                : "Entrar"}
          </button>
        </form>
      )}
    </section>
  );
}
