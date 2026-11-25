import { describe, expect, it } from "vitest";
import {
  enteroDesdeTexto,
  esIdValido,
  textoDe,
  vacioANull,
  valoresFormulario,
} from "./formularios";

describe("esIdValido", () => {
  it("acepta un uuid", () => {
    expect(esIdValido("3f1c2a4e-8b7d-4c3a-9f2e-1a2b3c4d5e6f")).toBe(true);
  });

  it("rechaza textos que no son uuid", () => {
    expect(esIdValido("123")).toBe(false);
    expect(esIdValido("")).toBe(false);
    expect(esIdValido(null)).toBe(false);
    expect(esIdValido("3f1c2a4e-8b7d-4c3a-9f2e-1a2b3c4d5e6f'; drop table")).toBe(false);
  });
});

describe("textoDe y valoresFormulario", () => {
  it("lee textos y trata archivos y ausentes como null", () => {
    const fd = new FormData();
    fd.set("nombre", "Ana");
    fd.set("archivo", new Blob(["x"]));
    expect(textoDe(fd, "nombre")).toBe("Ana");
    expect(textoDe(fd, "archivo")).toBeNull();
    expect(textoDe(fd, "falta")).toBeNull();
  });

  it("devuelve solo los campos pedidos, con vacío si faltan", () => {
    const fd = new FormData();
    fd.set("nombre", "Ana");
    fd.set("otro", "x");
    expect(valoresFormulario(fd, ["nombre", "email"])).toEqual({ nombre: "Ana", email: "" });
  });
});

describe("vacioANull", () => {
  it("convierte vacíos y ausentes en null y recorta", () => {
    expect(vacioANull("")).toBeNull();
    expect(vacioANull("   ")).toBeNull();
    expect(vacioANull(undefined)).toBeNull();
    expect(vacioANull(null)).toBeNull();
    expect(vacioANull("  hola ")).toBe("hola");
    expect(vacioANull(5)).toBe(5);
  });
});

describe("enteroDesdeTexto", () => {
  it("convierte enteros con o sin separadores de miles", () => {
    expect(enteroDesdeTexto("2020")).toBe(2020);
    expect(enteroDesdeTexto("150.000")).toBe(150000);
    expect(enteroDesdeTexto("1 250 000")).toBe(1250000);
    expect(enteroDesdeTexto("-5")).toBe(-5);
  });

  it("devuelve null si está vacío", () => {
    expect(enteroDesdeTexto("")).toBeNull();
    expect(enteroDesdeTexto(undefined)).toBeNull();
  });

  it("devuelve NaN si no es un entero", () => {
    expect(enteroDesdeTexto("12,5")).toBeNaN();
    expect(enteroDesdeTexto("abc")).toBeNaN();
    expect(enteroDesdeTexto("1e3")).toBeNaN();
  });
});
