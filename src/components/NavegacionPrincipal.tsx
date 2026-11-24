"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECCIONES, estaActiva } from "@/lib/navegacion";

/**
 * Navegación principal: barra inferior fija en móvil y columna lateral desde `md:`.
 */
export function NavegacionPrincipal() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:static md:border-t-0 md:border-r md:bg-transparent md:pb-0"
    >
      <ul className="grid grid-cols-5 md:flex md:flex-col md:gap-1 md:p-3">
        {SECCIONES.map((seccion) => {
          const activa = estaActiva(pathname, seccion.href);
          return (
            <li key={seccion.href}>
              <Link
                href={seccion.href}
                aria-current={activa ? "page" : undefined}
                className={`flex min-h-11 items-center justify-center px-1 py-2 text-xs font-medium md:justify-start md:rounded-md md:px-3 md:text-sm ${
                  activa
                    ? "text-slate-900 underline decoration-2 underline-offset-4 md:bg-slate-900 md:text-white md:no-underline"
                    : "text-slate-600 hover:text-slate-900 md:hover:bg-slate-100"
                }`}
              >
                {seccion.etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
