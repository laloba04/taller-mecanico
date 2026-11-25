/**
 * Matrículas (D12): se guardan y se buscan siempre normalizadas,
 * en mayúsculas y sin espacios, guiones ni puntos.
 */

/** Espacios (incluidos los Unicode y los de ancho cero), guiones de cualquier tipo y puntos. */
const SEPARADORES = /[\s​-‍﻿\-‐-―−.·]/gu;

const FORMATO_VALIDO = /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{4,10}$/;

/** "1234 bcd" → "1234BCD"; "m-1234-ab" → "M1234AB". No valida: solo normaliza. */
export function normalizarMatricula(texto: string): string {
  return texto.normalize("NFKC").replace(SEPARADORES, "").toUpperCase();
}

/** Recibe una matrícula ya normalizada: 4–10 caracteres A-Z/0-9 con al menos una letra y un dígito. */
export function esMatriculaValida(normalizada: string): boolean {
  return FORMATO_VALIDO.test(normalizada);
}

/** Texto para mostrar una matrícula (la forma normalizada). */
export function formatearMatricula(matricula: string): string {
  return normalizarMatricula(matricula);
}
