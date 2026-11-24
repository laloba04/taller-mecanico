import {
  AuthApiError,
  AuthPKCECodeVerifierMissingError,
  AuthSessionMissingError,
} from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
  ERROR_CONFIRMACION,
  ERROR_CONFIRMADO_OTRO_NAVEGADOR,
  codigoErrorIntercambio,
  parsearParametrosConfirmacion,
  resumenCookiesPkce,
  resumenErrorAuth,
} from "./confirmacion";

const CODE_REAL = "2b1f4c3e-8d7a-4b6c-9e5f-0a1b2c3d4e5f";

function parsear(consulta: string) {
  return parsearParametrosConfirmacion(new URLSearchParams(consulta));
}

describe("parsearParametrosConfirmacion", () => {
  it("acepta un code PKCE con forma de UUID", () => {
    expect(parsear(`code=${CODE_REAL}`)).toEqual({ tipo: "codigo", code: CODE_REAL });
  });

  it("acepta un code con otro formato (no exige UUID)", () => {
    expect(parsear("code=abc_DEF-123.xyz")).toEqual({ tipo: "codigo", code: "abc_DEF-123.xyz" });
  });

  it("ignora parámetros extra junto al code", () => {
    expect(parsear(`code=${CODE_REAL}&sb_flow_id=0123456789abcdef&utm=x`)).toEqual({
      tipo: "codigo",
      code: CODE_REAL,
    });
  });

  it("acepta token_hash + type", () => {
    expect(parsear("token_hash=pkce_abc123&type=signup")).toEqual({
      tipo: "otp",
      tokenHash: "pkce_abc123",
      type: "signup",
    });
  });

  it("prioriza token_hash + type si también llega code", () => {
    expect(parsear(`token_hash=h1&type=email&code=${CODE_REAL}`)).toMatchObject({ tipo: "otp" });
  });

  it("usa el code si token_hash llega con un type desconocido", () => {
    expect(parsear(`token_hash=h1&type=otro&code=${CODE_REAL}`)).toEqual({
      tipo: "codigo",
      code: CODE_REAL,
    });
  });

  it("reconoce el error que añade Supabase cuando el enlace caducó", () => {
    expect(
      parsear("error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid"),
    ).toEqual({ tipo: "error-proveedor", codigoError: "otp_expired" });
  });

  it("usa `error` si no llega error_code", () => {
    expect(parsear("error=access_denied")).toEqual({
      tipo: "error-proveedor",
      codigoError: "access_denied",
    });
  });

  it.each(["", "code=", "code=%20%20", "token_hash=h1", "type=signup"])(
    "'%s' es inválido",
    (consulta) => {
      expect(parsear(consulta)).toEqual({ tipo: "invalido" });
    },
  );
});

describe("codigoErrorIntercambio", () => {
  it("sin code verifier: el email ya está confirmado", () => {
    expect(codigoErrorIntercambio(new AuthPKCECodeVerifierMissingError())).toBe(
      ERROR_CONFIRMADO_OTRO_NAVEGADOR,
    );
  });

  it("se basa en el tipo del SDK y no en el mensaje", () => {
    const imitacion = new AuthApiError(
      "PKCE code verifier not found in storage.",
      400,
      "pkce_code_verifier_not_found",
    );
    expect(codigoErrorIntercambio(imitacion)).toBe(ERROR_CONFIRMACION);
  });

  it.each([
    ["code caducado", new AuthApiError("x", 400, "flow_state_expired")],
    ["code ya usado", new AuthApiError("x", 404, "flow_state_not_found")],
    ["sin sesión", new AuthSessionMissingError()],
    ["error genérico", new Error("x")],
    ["valor no error", "x"],
    ["null", null],
  ])("%s: error de confirmación genérico", (_caso, error) => {
    expect(codigoErrorIntercambio(error)).toBe(ERROR_CONFIRMACION);
  });
});

describe("resumenErrorAuth", () => {
  it("resume un error del SDK sin el mensaje", () => {
    const resumen = resumenErrorAuth(new AuthPKCECodeVerifierMissingError());
    expect(resumen).toEqual({
      nombre: "AuthPKCECodeVerifierMissingError",
      codigo: "pkce_code_verifier_not_found",
      estado: 400,
    });
    expect(JSON.stringify(resumen)).not.toContain("storage");
  });

  it("resume un error de la API", () => {
    expect(resumenErrorAuth(new AuthApiError("secreto a@b.c", 404, "flow_state_not_found"))).toEqual(
      { nombre: "AuthApiError", codigo: "flow_state_not_found", estado: 404 },
    );
  });

  it("resume errores que no son de Supabase", () => {
    expect(resumenErrorAuth(new TypeError("x"))).toEqual({
      nombre: "TypeError",
      codigo: null,
      estado: null,
    });
    expect(resumenErrorAuth("x")).toEqual({ nombre: "desconocido", codigo: null, estado: null });
  });
});

describe("resumenCookiesPkce", () => {
  const BASE = "sb-mbjwskouchonyfofqwff-auth-token";

  it("sin cookies no hay nada", () => {
    expect(resumenCookiesPkce([])).toEqual({
      verifierFijo: false,
      verifiersPorFlujo: 0,
      indiceFlujos: false,
    });
  });

  it("reconoce el verifier fijo, los de flujo y el índice", () => {
    expect(
      resumenCookiesPkce([
        `${BASE}-code-verifier`,
        `${BASE}-flow-0123456789abcdef0123456789abcdef-code-verifier`,
        `${BASE}-flow-fedcba9876543210fedcba9876543210-code-verifier`,
        `${BASE}-flows-code-verifier`,
        "__next_hmr_refresh_hash__",
      ]),
    ).toEqual({ verifierFijo: true, verifiersPorFlujo: 2, indiceFlujos: true });
  });

  it("solo el verifier fijo (estado tras un signUp fallido)", () => {
    expect(resumenCookiesPkce([`${BASE}-code-verifier`, "otra"])).toEqual({
      verifierFijo: true,
      verifiersPorFlujo: 0,
      indiceFlujos: false,
    });
  });

  it("cuenta una sola vez un verifier partido en trozos", () => {
    expect(
      resumenCookiesPkce([
        `${BASE}-flow-0123456789abcdef-code-verifier.0`,
        `${BASE}-flow-0123456789abcdef-code-verifier.1`,
      ]).verifiersPorFlujo,
    ).toBe(1);
  });

  it("no confunde la cookie de sesión con un verifier", () => {
    expect(resumenCookiesPkce([BASE, `${BASE}.0`])).toEqual({
      verifierFijo: false,
      verifiersPorFlujo: 0,
      indiceFlujos: false,
    });
  });
});
