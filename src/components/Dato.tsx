import type { ReactNode } from "react";

/** Par etiqueta/valor para fichas; usar dentro de un `<dl>`. */
export function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-slate-500">{etiqueta}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}
