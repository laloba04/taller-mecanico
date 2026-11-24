/** Marcador para secciones que aún no están implementadas. */
export function Proximamente({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-xl font-bold md:text-2xl">{titulo}</h1>
      <p className="text-slate-600">{descripcion}</p>
      <p className="rounded-md border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
        Próximamente.
      </p>
    </section>
  );
}
