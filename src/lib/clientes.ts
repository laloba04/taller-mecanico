import { z } from "zod";
import { vacioANull } from "./formularios";

export const CAMPOS_CLIENTE = ["nombre", "telefono", "email", "notas"] as const;

const TELEFONO = /^[0-9+\-() ]{6,20}$/;

export const esquemaCliente = z.object({
  nombre: z
    .string({ error: "Introduce el nombre." })
    .trim()
    .min(1, { error: "Introduce el nombre." })
    .max(120, { error: "El nombre no puede superar 120 caracteres." }),
  telefono: z.preprocess(
    vacioANull,
    z
      .string()
      .regex(TELEFONO, {
        error: "El teléfono solo puede tener dígitos, espacios, +, - y paréntesis (6 a 20 caracteres).",
      })
      .refine((t) => (t.match(/\d/g) ?? []).length >= 6, {
        error: "El teléfono debe tener al menos 6 dígitos.",
      })
      .nullable(),
  ),
  email: z.preprocess(
    vacioANull,
    z
      .email({ error: "Introduce un email válido." })
      .max(254, { error: "El email es demasiado largo." })
      .nullable(),
  ),
  notas: z.preprocess(
    vacioANull,
    z.string().max(1000, { error: "Las notas no pueden superar 1000 caracteres." }).nullable(),
  ),
});

export type DatosCliente = z.infer<typeof esquemaCliente>;
