import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { claseCampo } from "./estilos";

type Comun = {
  id: string;
  etiqueta: string;
  error?: string;
  ayuda?: string;
};

function Envoltorio({
  id,
  etiqueta,
  error,
  ayuda,
  children,
}: Comun & { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {etiqueta}
      </label>
      {children}
      {ayuda && (
        <p id={`${id}-ayuda`} className="text-xs text-slate-600">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function atributosAccesibles({ id, error, ayuda }: Comun) {
  const descripciones = [ayuda ? `${id}-ayuda` : null, error ? `${id}-error` : null].filter(
    (d): d is string => d !== null,
  );
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": descripciones.length > 0 ? descripciones.join(" ") : undefined,
  } as const;
}

/** Campo de texto con etiqueta, ayuda opcional y error accesible. */
export function CampoFormulario({
  id,
  etiqueta,
  error,
  ayuda,
  className,
  ...props
}: Comun & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Envoltorio id={id} etiqueta={etiqueta} error={error} ayuda={ayuda}>
      <input
        {...props}
        {...atributosAccesibles({ id, etiqueta, error, ayuda })}
        className={className ? `${claseCampo} ${className}` : claseCampo}
      />
    </Envoltorio>
  );
}

/** Área de texto con etiqueta y error accesible. */
export function CampoAreaTexto({
  id,
  etiqueta,
  error,
  ayuda,
  className,
  ...props
}: Comun & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Envoltorio id={id} etiqueta={etiqueta} error={error} ayuda={ayuda}>
      <textarea
        {...props}
        {...atributosAccesibles({ id, etiqueta, error, ayuda })}
        className={`${claseCampo} min-h-24 ${className ?? ""}`.trim()}
      />
    </Envoltorio>
  );
}

/** Selector con etiqueta y error accesible. */
export function CampoSelector({
  id,
  etiqueta,
  error,
  ayuda,
  children,
  className,
  ...props
}: Comun & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Envoltorio id={id} etiqueta={etiqueta} error={error} ayuda={ayuda}>
      <select
        {...props}
        {...atributosAccesibles({ id, etiqueta, error, ayuda })}
        className={className ? `${claseCampo} ${className}` : claseCampo}
      >
        {children}
      </select>
    </Envoltorio>
  );
}
