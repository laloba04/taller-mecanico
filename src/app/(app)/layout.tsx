import { redirect } from "next/navigation";
import { NavegacionPrincipal } from "@/components/NavegacionPrincipal";
import { RUTA_LOGIN } from "@/lib/rutas";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cerrarSesion } from "./actions";

export default async function LayoutApp({ children }: Readonly<{ children: React.ReactNode }>) {
  // Segunda defensa: el middleware ya redirige, pero comprobamos también aquí.
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(RUTA_LOGIN);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 px-4 py-2">
          <div className="min-w-0">
            <p className="font-bold">Taller mecánico</p>
            <p className="truncate text-xs text-slate-600">{user.email}</p>
          </div>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="min-h-11 shrink-0 rounded-md border border-slate-300 px-3 text-sm font-medium hover:bg-slate-100"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <div className="md:w-56 md:shrink-0">
          <NavegacionPrincipal />
        </div>
        {/* pb-24 en móvil para que la barra inferior fija no tape el contenido. */}
        <main className="w-full flex-1 p-4 pb-24 md:p-6 md:pb-6">{children}</main>
      </div>
    </div>
  );
}
