# Directrices que Develop debe cumplir

Cada regla es comprobable. Testing las verifica una a una con el método indicado.

| ID | Regla | Cómo se comprueba |
|---|---|---|
| D01 | Lint sin errores ni avisos | `npm run lint` |
| D02 | Tipos correctos | `npm run typecheck` |
| D03 | Los tests pasan y cada `src/lib/**/*.ts` con lógica tiene su `*.test.ts` | `npm test` + listar archivos de `src/lib` |
| D04 | El build de producción pasa | `npm run build` |
| D05 | Sin `any` explícito | `grep -rnE ": any\b|as any\b" src` sin resultados |
| D06 | Sin secretos en el repo; solo `.env.example` versionado | `git ls-files` no lista ningún `.env*` salvo `.env.example`; `git grep -nE "gsk_|sb_secret_|service_role|eyJhbGci"` sin resultados |
| D07 | Variables sin prefijo `NEXT_PUBLIC_` solo en código de servidor | los archivos con `"use client"` no contienen `process.env.` salvo `process.env.NEXT_PUBLIC_` |
| D08 | Cada tabla de `supabase/migrations` tiene RLS activado y políticas con `auth.uid() = user_id` para select, insert, update y delete | lectura del SQL (+ advisors de seguridad de Supabase sin errores, lo ejecuta el orquestador) |
| D09 | Toda Server Action valida la entrada con Zod antes de tocar la base de datos | cada `actions.ts` usa `.safeParse` o `.parse` antes de la consulta |
| D10 | Cálculos de dinero solo en `src/lib/calculos.ts`, en céntimos enteros; los tests cubren 0 líneas, decimales, IVA 21 % y otro tipo de IVA | lectura + tests |
| D11 | Los estados solo avanzan recibido → en_reparacion → listo → entregado (sin saltos ni retrocesos) | `src/lib/estados.ts` + tests |
| D12 | Matrícula normalizada (mayúsculas, sin espacios ni guiones) al guardar y al buscar | `src/lib/matricula.ts` + tests + uso en las actions y en la búsqueda |
| D13 | Sin sesión, toda ruta salvo `/login` y `/auth/*` redirige a `/login` | `src/middleware.ts` (matcher y lógica) + test de la función de rutas públicas |
| D14 | Móvil: los listados usan `ListaResponsive`; botones y enlaces de acción con `min-h-11`; sin anchos fijos mayores que `w-96` fuera de prefijos `md:`/`lg:` | grep en `src/app` y `src/components` |
| D15 | UI en español; importes mostrados con `formatEuro` | grep de `toFixed(` en `src/app` y `src/components` sin resultados |
| D16 | IA: `/api/ia/borrador` solo en servidor, valida la respuesta de Groq con Zod, devuelve 503 con mensaje claro si falta `GROQ_API_KEY` y solo genera un borrador que el usuario confirma | lectura + test con `fetch` simulado |
| D17 | Los errores mostrados al usuario no incluyen trazas ni mensajes internos de la base de datos | lectura de actions y route handlers |
| D18 | Sin `console.log` en `src` | `grep -rn "console.log" src` sin resultados |
