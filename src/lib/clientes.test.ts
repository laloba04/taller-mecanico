import { describe, expect, it } from "vitest";
import { erroresPorCampo } from "./auth";
import { esquemaCliente } from "./clientes";

function errores(datos: Record<string, unknown>) {
  const r = esquemaCliente.safeParse(datos);
  if (r.success) throw new Error("Se esperaba un error de validación");
  return erroresPorCampo(r.error);
}

describe("esquemaCliente", () => {
  it("acepta un cliente completo y recorta los textos", () => {
    const r = esquemaCliente.safeParse({
      nombre: "  Ana López ",
      telefono: " +34 (600) 111-222 ",
      email: " ana@taller.es ",
      notas: " Cliente habitual ",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).toEqual({
        nombre: "Ana López",
        telefono: "+34 (600) 111-222",
        email: "ana@taller.es",
        notas: "Cliente habitual",
      });
    }
  });

  it("convierte opcionales vacíos o ausentes en null", () => {
    const r = esquemaCliente.safeParse({ nombre: "Luis", telefono: "", email: "  ", notas: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toEqual({ nombre: "Luis", telefono: null, email: null, notas: null });

    const r2 = esquemaCliente.safeParse({ nombre: "Luis" });
    expect(r2.success).toBe(true);
    if (r2.success) expect(r2.data.telefono).toBeNull();
  });

  it("exige el nombre", () => {
    expect(errores({ nombre: "   " }).nombre).toBe("Introduce el nombre.");
    expect(errores({}).nombre).toBe("Introduce el nombre.");
  });

  it("limita el nombre a 120 caracteres", () => {
    expect(esquemaCliente.safeParse({ nombre: "a".repeat(120) }).success).toBe(true);
    expect(errores({ nombre: "a".repeat(121) }).nombre).toMatch(/120/);
  });

  it("valida el teléfono", () => {
    expect(errores({ nombre: "A", telefono: "600abc111" }).telefono).toMatch(/dígitos/);
    expect(errores({ nombre: "A", telefono: "12345" }).telefono).toBeDefined();
    expect(errores({ nombre: "A", telefono: "1".repeat(21) }).telefono).toBeDefined();
    expect(errores({ nombre: "A", telefono: "((--))" }).telefono).toBe(
      "El teléfono debe tener al menos 6 dígitos.",
    );
    expect(esquemaCliente.safeParse({ nombre: "A", telefono: "600111222" }).success).toBe(true);
  });

  it("valida el email", () => {
    expect(errores({ nombre: "A", email: "no-es-email" }).email).toBe("Introduce un email válido.");
  });

  it("limita las notas a 1000 caracteres", () => {
    expect(esquemaCliente.safeParse({ nombre: "A", notas: "x".repeat(1000) }).success).toBe(true);
    expect(errores({ nombre: "A", notas: "x".repeat(1001) }).notas).toMatch(/1000/);
  });
});
