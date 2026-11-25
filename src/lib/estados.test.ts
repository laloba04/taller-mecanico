import { describe, expect, it } from "vitest";
import {
  ESTADOS,
  ETIQUETA_ESTADO,
  esEditable,
  esEstado,
  puedeTransicionar,
  siguienteEstado,
  type EstadoOrden,
} from "./estados";

describe("ESTADOS y etiquetas", () => {
  it("están en el orden del flujo de trabajo", () => {
    expect(ESTADOS).toEqual(["recibido", "en_reparacion", "listo", "entregado"]);
  });

  it("tienen etiqueta en español", () => {
    expect(ESTADOS.map((e) => ETIQUETA_ESTADO[e])).toEqual([
      "Recibido",
      "En reparación",
      "Listo para entregar",
      "Entregado",
    ]);
  });

  it("esEstado reconoce solo los estados válidos", () => {
    for (const estado of ESTADOS) expect(esEstado(estado)).toBe(true);
    expect(esEstado("cancelado")).toBe(false);
    expect(esEstado("")).toBe(false);
    expect(esEstado(null)).toBe(false);
    expect(esEstado(1)).toBe(false);
  });
});

describe("siguienteEstado", () => {
  it("avanza de uno en uno y termina en entregado", () => {
    expect(siguienteEstado("recibido")).toBe("en_reparacion");
    expect(siguienteEstado("en_reparacion")).toBe("listo");
    expect(siguienteEstado("listo")).toBe("entregado");
    expect(siguienteEstado("entregado")).toBeNull();
  });

  it("devuelve null para un estado desconocido", () => {
    expect(siguienteEstado("cancelado" as EstadoOrden)).toBeNull();
  });
});

describe("puedeTransicionar", () => {
  const permitidas = new Set([
    "recibido>en_reparacion",
    "en_reparacion>listo",
    "listo>entregado",
  ]);

  // Las 16 combinaciones: solo las 3 del siguiente inmediato son válidas.
  for (const desde of ESTADOS) {
    for (const hasta of ESTADOS) {
      const esperado = permitidas.has(`${desde}>${hasta}`);
      it(`${desde} → ${hasta}: ${esperado ? "permitido" : "rechazado"}`, () => {
        expect(puedeTransicionar(desde, hasta)).toBe(esperado);
      });
    }
  }

  it("rechaza estados desconocidos", () => {
    expect(puedeTransicionar("recibido", "cancelado" as EstadoOrden)).toBe(false);
    expect(puedeTransicionar("cancelado" as EstadoOrden, "recibido")).toBe(false);
  });
});

describe("esEditable", () => {
  it("permite editar salvo en entregado", () => {
    expect(esEditable("recibido")).toBe(true);
    expect(esEditable("en_reparacion")).toBe(true);
    expect(esEditable("listo")).toBe(true);
    expect(esEditable("entregado")).toBe(false);
  });

  it("no permite editar un estado desconocido", () => {
    expect(esEditable("cancelado" as EstadoOrden)).toBe(false);
  });
});
