# Taller mecánico

App web para gestionar un taller: clientes, vehículos, órdenes de trabajo (estados, piezas, mano de obra, IVA), historial por matrícula, panel, PDF de presupuesto/factura y borrador de orden con IA. Cada usuario solo ve sus datos (RLS).

## Stack
Next.js 15 (App Router, TS estricto) · Tailwind 4 · Supabase (`@supabase/ssr`) · Zod · Vitest · @react-pdf/renderer · Groq · Vercel.

## Comandos
- `npm run dev` — desarrollo (http://localhost:3000)
- `npm run lint` — ESLint (0 errores, 0 avisos)
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — Vitest
- `npm run build` — build de producción
- `npm run check` — los cuatro anteriores en orden

## Estructura
- `src/app/` rutas (`(auth)/login`, `(app)/panel`, `clientes`, `vehiculos`, `ordenes`, `historial`, `api/`)
- `src/components/` UI reutilizable
- `src/lib/` lógica pura y testeable (`calculos.ts`, `estados.ts`, `matricula.ts`, `formato.ts`, `ia.ts`)
- `src/lib/supabase/` clientes servidor/navegador
- `supabase/migrations/` SQL versionado (esquema + RLS)
- Tests: `*.test.ts(x)` junto al archivo que prueban

## Equipo de agentes
- **Orquestador (sesión principal):** sigue el plan, reparte tareas, registra y hace commits. No programa funcionalidades.
- **develop** (`.claude/agents/develop.md`): implementa + tests.
- **testing** (`.claude/agents/testing.md`): verifica `DIRECTRICES.md` y ejecuta `npm run check`. No edita.

Flujo por tarea: develop → testing → (si RECHAZADO) informe a develop → repetir → APROBADO → anotar fallos en `docs/agentes.md` → commit convencional (`feat:`, `fix:`, `test:`, `chore:`, `docs:`), uno por funcionalidad.
Nada está terminado sin `npm run check` en verde y veredicto APROBADO.

## Reglas
- Secretos solo en `.env.local` (los agentes no lo leen ni lo editan) y en Vercel. `.env.example` sin valores.
- Parar al final de cada fase para revisión del usuario. Pedir permiso antes de crear recursos externos.
- Supabase: usar el proyecto existente `taller-mecanico` del usuario.

## Plan por fases
0. Base y agentes ✅
1. Supabase (esquema + RLS) + CI en GitHub ✅
2. Auth + layout móvil ✅
3. Clientes y vehículos ✅
4. Órdenes de trabajo (estados, líneas, IVA, total)
5. Historial por matrícula + panel
6. PDF presupuesto/factura
7. Borrador de orden con IA (Groq)
8. Datos demo + Vercel público + README final

Estado actual: Fase 3 terminada (clientes y vehículos con búsqueda, matrícula normalizada, CI en verde). Fase 4 en curso. Nota: `next dev` usa `.next-dev` y `next build` usa `.next`.
