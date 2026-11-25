import { z } from "zod";
import { filtroOrIlike, patronBusqueda } from "./busqueda";
import { enteroDesdeTexto, vacioANull } from "./formularios";
import { esMatriculaValida, normalizarMatricula } from "./matricula";

export const CAMPOS_VEHICULO = [
  "cliente_id",
  "matricula",
  "marca",
  "modelo",
  "anio",
  "kilometros",
] as const;

export const ANIO_MINIMO = 1900;
export const KILOMETROS_MAXIMOS = 9_999_999;

/** Año máximo admitido: el siguiente al actual (modelos del año que viene). */
export function anioMaximo(hoy: Date = new Date()): number {
  return hoy.getFullYear() + 1;
}

const textoOpcional = (max: number, campo: string) =>
  z.preprocess(
    vacioANull,
    z.string().max(max, { error: `${campo} no puede superar ${max} caracteres.` }).nullable(),
  );

/** Valida datos de vehículo procedentes de un formulario (todos los valores llegan como texto). */
export const esquemaVehiculo = z.object({
  cliente_id: z.uuid({ error: "Elige un cliente." }),
  matricula: z
    .string({ error: "Introduce la matrícula." })
    .transform(normalizarMatricula)
    .pipe(
      z
        .string()
        .min(1, { error: "Introduce la matrícula." })
        .refine(esMatriculaValida, {
          error: "Matrícula no válida: de 4 a 10 letras y números, con al menos una letra y un número.",
        }),
    ),
  marca: textoOpcional(60, "La marca"),
  modelo: textoOpcional(60, "El modelo"),
  anio: z.preprocess(
    enteroDesdeTexto,
    z
      .number({ error: "El año debe ser un número entero." })
      .int({ error: "El año debe ser un número entero." })
      .min(ANIO_MINIMO, { error: `El año no puede ser anterior a ${ANIO_MINIMO}.` })
      .refine((anio) => anio <= anioMaximo(), {
        error: "El año no puede ser posterior al año que viene.",
      })
      .nullable(),
  ),
  kilometros: z.preprocess(
    enteroDesdeTexto,
    z
      .number({ error: "Los kilómetros deben ser un número entero." })
      .int({ error: "Los kilómetros deben ser un número entero." })
      .min(0, { error: "Los kilómetros no pueden ser negativos." })
      .max(KILOMETROS_MAXIMOS, { error: "Los kilómetros no pueden superar 9.999.999." })
      .nullable(),
  ),
});

export type DatosVehiculo = z.infer<typeof esquemaVehiculo>;

/**
 * Filtro para `.or()` del listado de vehículos: la matrícula se compara
 * normalizada (D12) y el texto tal cual se busca en marca y modelo.
 * Devuelve null si no hay nada que buscar.
 */
export function filtroVehiculos(texto: string): string | null {
  const condiciones: string[] = [];
  const patronMatricula = patronBusqueda(normalizarMatricula(texto));
  if (patronMatricula) condiciones.push(filtroOrIlike(["matricula"], patronMatricula));
  const patronTexto = patronBusqueda(texto);
  if (patronTexto) condiciones.push(filtroOrIlike(["marca", "modelo"], patronTexto));
  return condiciones.length > 0 ? condiciones.join(",") : null;
}
