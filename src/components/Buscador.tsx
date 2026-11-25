import Link from "next/link";
import { claseBotonPrimario, claseBotonSecundario, claseCampo } from "./estilos";

type Props = {
  /** Ruta a la que se envía la búsqueda (GET con `?q=`). */
  ruta: string;
  valor: string;
  etiqueta: string;
  placeholder?: string;
};

/** Formulario de búsqueda por GET; funciona sin JavaScript. */
export function Buscador({ ruta, valor, etiqueta, placeholder }: Props) {
  return (
    <form action={ruta} method="get" role="search" className="flex flex-col gap-2 sm:flex-row">
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
          <Link href={ruta} className={`${claseBotonSecundario} flex-1 sm:flex-none`}>
            Limpiar
          </Link>
        )}
      </div>
    </form>
  );
}
