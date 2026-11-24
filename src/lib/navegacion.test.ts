import { describe, expect, it } from "vitest";
import { SECCIONES, estaActiva } from "./navegacion";

describe("SECCIONES", () => {
  it("contiene las cinco secciones en orden", () => {
    expect(SECCIONES.map((s) => s.href)).toEqual([
      "/panel",
      "/clientes",
      "/vehiculos",
      "/ordenes",
      "/historial",
    ]);
    expect(SECCIONES.map((s) => s.etiqueta)).toEqual([
      "Panel",
      "Clientes",
      "Vehículos",
      "Órdenes",
      "Historial",
    ]);
  });
});

describe("estaActiva", () => {
  it("es activa en la ruta exacta", () => {
    expect(estaActiva("/clientes", "/clientes")).toBe(true);
  });

  it("es activa en subrutas", () => {
    expect(estaActiva("/clientes/123/editar", "/clientes")).toBe(true);
  });

  it("no confunde prefijos parecidos", () => {
    expect(estaActiva("/clientes-viejos", "/clientes")).toBe(false);
    expect(estaActiva("/panelx", "/panel")).toBe(false);
  });

  it("no es activa en otra sección", () => {
    expect(estaActiva("/ordenes", "/clientes")).toBe(false);
  });
});
