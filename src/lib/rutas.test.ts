import { describe, expect, it } from "vitest";
import { RUTA_INICIO, destinoSeguro, esRutaPublica, origenDesdeCabeceras } from "./rutas";

describe("esRutaPublica", () => {
  it.each(["/login", "/login/", "/auth/confirm", "/auth/otra/mas", "/auth"])(
    "%s es pública",
    (ruta) => {
      expect(esRutaPublica(ruta)).toBe(true);
    },
  );

  it.each([
    "/",
    "/panel",
    "/clientes",
    "/login-x",
    "/loginx",
    "/login/otra",
    "/authx",
    "/autho/confirm",
    "/x/login",
    "/x/auth/confirm",
  ])("%s no es pública", (ruta) => {
    expect(esRutaPublica(ruta)).toBe(false);
  });
});

describe("destinoSeguro", () => {
  it("la ruta de inicio es /panel", () => {
    expect(RUTA_INICIO).toBe("/panel");
  });

  it.each(["/clientes", "/ordenes/123?x=1", "/panel"])("acepta la ruta interna %s", (ruta) => {
    expect(destinoSeguro(ruta)).toBe(ruta);
  });

  it.each([
    null,
    undefined,
    "",
    "panel",
    "https://malo.com",
    "//malo.com",
    "/\\malo.com",
    "\\\\malo.com",
    "javascript:alert(1)",
    "/\tmalo",
  ])("rechaza %s y devuelve /panel", (ruta) => {
    expect(destinoSeguro(ruta)).toBe("/panel");
  });
});

function cabeceras(valores: Record<string, string>) {
  const mapa = new Map(Object.entries(valores));
  return { get: (n: string) => mapa.get(n) ?? null };
}

describe("origenDesdeCabeceras", () => {
  it("usa la cabecera origin si es válida", () => {
    expect(origenDesdeCabeceras(cabeceras({ origin: "https://taller.app" }))).toBe(
      "https://taller.app",
    );
  });

  it("construye el origen con x-forwarded-host y x-forwarded-proto", () => {
    expect(
      origenDesdeCabeceras(
        cabeceras({ "x-forwarded-host": "taller.vercel.app", "x-forwarded-proto": "https" }),
      ),
    ).toBe("https://taller.vercel.app");
  });

  it("usa http para localhost sin proto", () => {
    expect(origenDesdeCabeceras(cabeceras({ host: "localhost:3000" }))).toBe(
      "http://localhost:3000",
    );
  });

  it("usa https por defecto para otros hosts", () => {
    expect(origenDesdeCabeceras(cabeceras({ host: "taller.app" }))).toBe("https://taller.app");
  });

  it("devuelve null sin host", () => {
    expect(origenDesdeCabeceras(cabeceras({}))).toBeNull();
  });

  it("ignora un origin con ruta y usa el host", () => {
    expect(origenDesdeCabeceras(cabeceras({ origin: "https://a.com/x", host: "b.com" }))).toBe(
      "https://b.com",
    );
  });
});
