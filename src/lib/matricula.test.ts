import { describe, expect, it } from "vitest";
import { esMatriculaValida, formatearMatricula, normalizarMatricula } from "./matricula";

describe("normalizarMatricula", () => {
  it.each([
    ["1234 bcd", "1234BCD"],
    ["1234-BCD", "1234BCD"],
    ["m-1234-ab", "M1234AB"],
    ["  1234bcd  ", "1234BCD"],
    ["1234.BCD", "1234BCD"],
    ["1234 BCD", "1234BCD"], // espacio de no separación
    ["1234 BCD", "1234BCD"], // espacio fino
    ["1234​BCD", "1234BCD"], // espacio de ancho cero
    ["1234–BCD", "1234BCD"], // guion largo
    ["１２３４ bcd", "1234BCD"], // dígitos de ancho completo
    ["", ""],
  ])("normaliza %j como %j", (entrada, esperado) => {
    expect(normalizarMatricula(entrada)).toBe(esperado);
  });

  it("conserva otros símbolos para que la validación los rechace", () => {
    expect(normalizarMatricula("12#4 bcd")).toBe("12#4BCD");
  });

  it("es idempotente", () => {
    const una = normalizarMatricula("m-1234-ab");
    expect(normalizarMatricula(una)).toBe(una);
  });
});

describe("esMatriculaValida", () => {
  it.each(["1234BCD", "M1234AB", "B1234X", "E1234BCD", "AB12"])("acepta %s", (m) => {
    expect(esMatriculaValida(m)).toBe(true);
  });

  it.each([
    ["vacía", ""],
    ["demasiado corta", "A12"],
    ["demasiado larga", "ABCDE123456"],
    ["solo dígitos", "123456"],
    ["solo letras", "ABCDEF"],
    ["minúsculas (sin normalizar)", "1234bcd"],
    ["con espacio (sin normalizar)", "1234 BCD"],
    ["con símbolos", "12#4BCD"],
    ["con ñ", "1234ÑBC"],
  ])("rechaza %s", (_motivo, m) => {
    expect(esMatriculaValida(m)).toBe(false);
  });

  it("acepta la forma normalizada de entradas típicas", () => {
    expect(esMatriculaValida(normalizarMatricula("1234 bcd"))).toBe(true);
    expect(esMatriculaValida(normalizarMatricula("m-1234-ab"))).toBe(true);
  });
});

describe("formatearMatricula", () => {
  it("devuelve la forma normalizada", () => {
    expect(formatearMatricula("1234BCD")).toBe("1234BCD");
    expect(formatearMatricula("1234 bcd")).toBe("1234BCD");
  });
});
