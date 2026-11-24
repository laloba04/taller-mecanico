import type { ReactNode } from "react";

export type ColumnaLista<T> = {
  titulo: string;
  celda: (elemento: T) => ReactNode;
};

type Props<T> = {
  elementos: readonly T[];
  columnas: readonly ColumnaLista<T>[];
  clave: (elemento: T) => string;
  vacio?: ReactNode;
};

/**
 * Listado responsive (D14): tarjetas apiladas en móvil y tabla desde `md:`.
 */
export function ListaResponsive<T>({
  elementos,
  columnas,
  clave,
  vacio = "No hay elementos.",
}: Props<T>) {
  if (elementos.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-slate-300 bg-white p-4 text-center text-slate-600">
        {vacio}
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden">
        {elementos.map((elemento) => (
          <li
            key={clave(elemento)}
            className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
          >
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              {columnas.map((columna) => (
                <div key={columna.titulo} className="contents">
                  <dt className="text-sm text-slate-500">{columna.titulo}</dt>
                  <dd className="min-w-0 break-words">{columna.celda(elemento)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {columnas.map((columna) => (
                <th key={columna.titulo} scope="col" className="px-4 py-3 font-medium">
                  {columna.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {elementos.map((elemento) => (
              <tr key={clave(elemento)}>
                {columnas.map((columna) => (
                  <td key={columna.titulo} className="px-4 py-3 align-top">
                    {columna.celda(elemento)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
