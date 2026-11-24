export type Seccion = {
  href: string;
  etiqueta: string;
};

export const SECCIONES: readonly Seccion[] = [
  { href: "/panel", etiqueta: "Panel" },
  { href: "/clientes", etiqueta: "Clientes" },
  { href: "/vehiculos", etiqueta: "Vehículos" },
  { href: "/ordenes", etiqueta: "Órdenes" },
  { href: "/historial", etiqueta: "Historial" },
];

/** Indica si la sección `href` corresponde a la ruta actual (incluye subrutas). */
export function estaActiva(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return pathname.startsWith(href.endsWith("/") ? href : `${href}/`);
}
