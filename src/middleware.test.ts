// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { middleware } from "./middleware";

const URL_SUPABASE = "https://abcdefghijklmnop.supabase.co";
const CLAVE = "sb-abcdefghijklmnop-auth-token";
const VERIFIERS = {
  [`${CLAVE}-code-verifier`]: "base64-ImFiYyI",
  [`${CLAVE}-flow-0123456789abcdef0123456789abcdef-code-verifier`]: "base64-ImFiYyI",
  [`${CLAVE}-flows-code-verifier`]: "base64-WyIwMTIzNDU2Nzg5YWJjZGVmMDEyMzQ1Njc4OWFiY2RlZiJd",
};

function peticion(ruta: string, cookies: Record<string, string> = {}): NextRequest {
  const cabecera = Object.entries(cookies)
    .map(([nombre, valor]) => `${nombre}=${valor}`)
    .join("; ");
  return new NextRequest(new URL(ruta, "http://localhost:3000"), {
    headers: cabecera ? { cookie: cabecera } : {},
  });
}

function sesionCodificada(): string {
  const sesion = {
    access_token: "token-valido",
    refresh_token: "refresco",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: "u1" },
  };
  return `base64-${Buffer.from(JSON.stringify(sesion)).toString("base64url")}`;
}

const fetchSimulado = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL_SUPABASE);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "clave-anonima");
  fetchSimulado.mockReset();
  fetchSimulado.mockRejectedValue(new Error("no debería llamar a Supabase"));
  vi.stubGlobal("fetch", fetchSimulado);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("middleware", () => {
  it("en /login sin sesión deja pasar y no borra las cookies *-code-verifier de PKCE", async () => {
    const respuesta = await middleware(peticion("/login", VERIFIERS));

    expect(respuesta.headers.get("location")).toBeNull();
    expect(respuesta.headers.get("x-middleware-next")).toBe("1");
    expect(respuesta.headers.getSetCookie()).toEqual([]);
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it("sin sesión redirige una ruta privada a /login con ?siguiente (D13)", async () => {
    const respuesta = await middleware(peticion("/clientes?q=1", VERIFIERS));

    const destino = new URL(respuesta.headers.get("location") ?? "");
    expect(respuesta.status).toBe(307);
    expect(destino.pathname).toBe("/login");
    expect(destino.searchParams.get("siguiente")).toBe("/clientes?q=1");
    expect(respuesta.headers.getSetCookie()).toEqual([]);
  });

  it("sin sesión redirige / a /login sin ?siguiente", async () => {
    const respuesta = await middleware(peticion("/"));

    expect(respuesta.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("no toca la sesión en /auth/* (ni llama a Supabase ni escribe cookies)", async () => {
    const respuesta = await middleware(
      peticion("/auth/confirm?code=abc", { ...VERIFIERS, [CLAVE]: sesionCodificada() }),
    );

    expect(respuesta.headers.get("location")).toBeNull();
    expect(respuesta.headers.getSetCookie()).toEqual([]);
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it("con sesión válida redirige /login a /panel", async () => {
    fetchSimulado.mockResolvedValue(
      new Response(JSON.stringify({ id: "u1", aud: "authenticated", app_metadata: {} }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const respuesta = await middleware(peticion("/login", { [CLAVE]: sesionCodificada() }));

    expect(respuesta.headers.get("location")).toBe("http://localhost:3000/panel");
  });
});
