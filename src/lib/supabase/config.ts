export type ConfigSupabase = {
  url: string;
  anonKey: string;
};

/**
 * Valida la configuración pública de Supabase.
 * Recibe los valores ya leídos para que Next.js pueda incrustar
 * `process.env.NEXT_PUBLIC_*` en el código del navegador.
 */
export function validarConfigSupabase(
  url: string | undefined,
  anonKey: string | undefined,
): ConfigSupabase {
  const urlLimpia = url?.trim();
  const claveLimpia = anonKey?.trim();
  const faltan: string[] = [];
  if (!urlLimpia) faltan.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!claveLimpia) faltan.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (faltan.length > 0 || !urlLimpia || !claveLimpia) {
    throw new Error(
      `Falta configurar Supabase: define ${faltan.join(" y ")} en .env.local (o en Vercel).`,
    );
  }
  return { url: urlLimpia, anonKey: claveLimpia };
}
