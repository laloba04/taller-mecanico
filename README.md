# Taller mecánico

App web para gestionar un taller mecánico: clientes y vehículos, órdenes de trabajo con estados (recibido → en reparación → listo → entregado), piezas, mano de obra, IVA y total, historial por matrícula, panel del taller, presupuesto/factura en PDF y un borrador de orden generado con IA a partir de la descripción del problema. Cada usuario solo ve sus datos (Row Level Security en Supabase). Pensada para usarse en el móvil.

> 🚧 En construcción. El enlace público y el usuario de prueba se añadirán al final.

## Enlace público
_Pendiente (Fase 8)._

## Usuario de prueba
_Pendiente (Fase 8)._

## Cómo se ha construido: equipo de agentes
- **Orquestador** — sesión principal de Claude Code, guiada por [`CLAUDE.md`](CLAUDE.md): sigue el plan por fases, reparte tareas, registra y hace commits.
- **Develop** — [`.claude/agents/develop.md`](.claude/agents/develop.md): programa cada funcionalidad con sus tests.
- **Testing** — [`.claude/agents/testing.md`](.claude/agents/testing.md): comprueba una a una las [`DIRECTRICES.md`](DIRECTRICES.md) y ejecuta lint, tipos, tests y build. No puede editar código; devuelve los fallos a Develop hasta que todo pasa.

El registro de fallos detectados y corregidos está en [`docs/agentes.md`](docs/agentes.md).

## Ejecutar en local
```bash
npm install
cp .env.example .env.local   # rellena los valores
npm run dev                  # http://localhost:3000
npm run check                # lint + tipos + tests + build
```

## Stack
Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · Supabase · Zod · Vitest · Groq · Vercel · GitHub Actions (lint, tests, build y Gitleaks).
