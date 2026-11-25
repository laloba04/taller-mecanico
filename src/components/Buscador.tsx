import Link from "next/link";
import { claseBotonPrimario, claseBotonSecundario, claseCampo } from "./estilos";

type Props = {
  /** Ruta a la que se envía la búsqueda (GET con `?q=`). */
  ruta: string;
  valor: string;
  etiqueta: string;
  placeholder?: string;
  /** Parámetros que se conservan al buscar y al limpiar (p. ej. un filtro de estado). */
  ocultos?: Readonly<Record<string, string>>;
};

/** Formulario de búsqueda por GET; funciona sin JavaScript. */
export function Buscador({ ruta, valor, etiqueta, placeholder, ocultos = {} }: Props) {
  const parametrosOcultos = new URLSearchParams(ocultos).toString();
  const rutaLimpiar = parametrosOcultos ? `${ruta}?${parametrosOcultos}` : ruta;
  return (
    <form action={ruta} method="get" role="search" className="flex flex-col gap-2 sm:flex-row">
      {Object.entries(ocultos).map(([nombre, valorOculto]) => (
        <input key={nombre} type="hidden" name={nombre} value={valorOculto} />
      ))}
      <label htmlFor="buscador-q" className="sr-only">
        {etiqueta}
      </label>
      <input
        id="buscador-q"
        type="search"
        name="q"
        defaultValue={valor}
        placeholder={placeholder ?? etiqueta}
        maxLength={100}
        autoComplete="off"
        className={`${claseCampo} sm:flex-1`}
      />
      <div className="flex gap-2">
        <button type="submit" className={`${claseBotonPrimario} flex-1 sm:flex-none`}>
          Buscar
        </button>
        {valor !== "" && (
          <Link href={rutaLimpiar} className={`${claseBotonSecundario} flex-1 sm:flex-none`}>
            Limpiar
          </Link>
        )}
      </div>
    </form>
  );
}
