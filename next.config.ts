import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

/**
 * `next dev` escribe en `.next-dev` y `next build`/`start` en `.next`, para que
 * un build (p. ej. `npm run check`) no pise al servidor de desarrollo en marcha.
 */
export default function configuracion(phase: string): NextConfig {
  return {
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
