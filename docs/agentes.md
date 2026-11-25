# Registro del equipo de agentes

Fallos que Testing detectó en las entregas de Develop y cómo se corrigieron.

| Fecha | Fase | Regla | Fallo detectado por Testing | Corrección de Develop |
|---|---|---|---|---|
| 2026-11-25 | 3 | D14 | En el listado de clientes, el enlace `tel:` del teléfono no tenía clase y le faltaba `min-h-11` (`clientes/page.tsx`). | Se le aplicó `claseEnlace` (`inline-flex min-h-11 …`), igual que al resto de enlaces del listado. |
| 2026-11-25 | 3 | D12 / D03 | `filtroVehiculos` (búsqueda por matrícula normalizada) vivía dentro de `vehiculos/page.tsx` sin tests: quitar la normalización no habría hecho fallar ningún test. | Se movió a `src/lib/vehiculos.ts` con 5 tests (p. ej. `"1234 bcd"` → `matricula.ilike."%1234BCD%"`, vacíos → null, escapado de `,()"` y `%_`). |
