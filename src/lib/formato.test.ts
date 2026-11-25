import { describe, expect, it } from "vitest";
import { formatCantidad, formatEuro, formatFecha } from "./formato";

const normaliza = (s: string) => s.replace(/\s/g, " ");

describe("formatEuro", () => {
  it("formatea céntimos como euros con dos decimales", () => {
    expect(normaliza(formatEuro(1234567))).toBe("12.345,67 €");
  });

  it("formatea cero", () => {
    expect(normaliza(formatEuro(0))).toBe("0,00 €");
  });

  it("formatea negativos", () => {
    expect(normaliza(formatEuro(-550))).toBe("-5,50 €");
  });
});

describe("formatCantidad", () => {
  it("muestra hasta 2 decimales con coma", () => {
    expect(formatCantidad(1.5)).toBe("1,5");
    expect(formatCantidad(2)).toBe("2");
    expect(formatCantidad(0.25)).toBe("0,25");
    expect(normaliza(formatCantidad(1234.5))).toBe("1234,5");
    expect(normaliza(formatCantidad(12345.5))).toBe("12.345,5");
  });

  it("acepta el texto que devuelve la BD y marca los inválidos", () => {
    expect(formatCantidad("3.50")).toBe("3,5");
    expect(formatCantidad("abc")).toBe("—");
  });
});

describe("formatFecha", () => {
  it("formatea en dd/mm/aaaa con la hora de España", () => {
    expect(formatFecha("2026-11-25T10:00:00Z")).toBe("25/11/2026");
    // 23:30 UTC del 31/12 ya es 1 de enero en Madrid
    expect(formatFecha("2026-12-31T23:30:00Z")).toBe("01/01/2027");
  });

  it("devuelve un guion si falta o no es válida", () => {
    expect(formatFecha(null)).toBe("—");
    expect(formatFecha(undefined)).toBe("—");
    expect(formatFecha("")).toBe("—");
    expect(formatFecha("no es fecha")).toBe("—");
  });
});
