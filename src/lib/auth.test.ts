import { describe, expect, it } from "vitest";
import {
  MENSAJE_ERROR_GENERICO,
  erroresPorCampo,
  esquemaLogin,
  esquemaRegistro,
  mensajeErrorAuth,
} from "./auth";

describe("esquemaLogin", () => {
  it("acepta email y contraseña y recorta el email", () => {
    const r = esquemaLogin.safeParse({ email: " ana@taller.es ", password: "x" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("ana@taller.es");
  });

  it("rechaza un email inválido con mensaje en español", () => {
    const r = esquemaLogin.safeParse({ email: "no-es-email", password: "x" });
    expect(r.success).toBe(false);
    if (!r.success) expect(erroresPorCampo(r.error).email).toBe("Introduce un email válido.");
  });

  it("rechaza email vacío y contraseña vacía", () => {
    const r = esquemaLogin.safeParse({ email: "", password: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const errores = erroresPorCampo(r.error);
      expect(errores.email).toBe("Introduce tu email.");
      expect(errores.password).toBe("Introduce tu contraseña.");
    }
  });

  it("rechaza campos ausentes (FormData.get devuelve null)", () => {
    const r = esquemaLogin.safeParse({ email: null, password: null });
    expect(r.success).toBe(false);
    if (!r.success) {
      const errores = erroresPorCampo(r.error);
      expect(errores.email).toBe("Introduce tu email.");
      expect(errores.password).toBe("Introduce tu contraseña.");
    }
  });
});

describe("esquemaRegistro", () => {
  it("acepta datos válidos", () => {
    const r = esquemaRegistro.safeParse({
      email: "ana@taller.es",
      password: "12345678",
      confirmacion: "12345678",
    });
    expect(r.success).toBe(true);
  });

  it("exige al menos 8 caracteres", () => {
    const r = esquemaRegistro.safeParse({
      email: "ana@taller.es",
      password: "1234567",
      confirmacion: "1234567",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(erroresPorCampo(r.error).password).toBe(
        "La contraseña debe tener al menos 8 caracteres.",
      );
    }
  });

  it("exige que la confirmación coincida", () => {
    const r = esquemaRegistro.safeParse({
      email: "ana@taller.es",
      password: "12345678",
      confirmacion: "87654321",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(erroresPorCampo(r.error).confirmacion).toBe("Las contraseñas no coinciden.");
    }
  });
});

describe("mensajeErrorAuth", () => {
  it.each([
    ["invalid_credentials", "Email o contraseña incorrectos."],
    ["email_not_confirmed", "Debes confirmar tu email antes de entrar. Revisa tu correo."],
    ["user_already_exists", "Ya existe una cuenta con ese email."],
    ["email_exists", "Ya existe una cuenta con ese email."],
    ["over_request_rate_limit", "Demasiados intentos. Espera unos minutos y vuelve a probar."],
    ["over_email_send_rate_limit", "Demasiados intentos. Espera unos minutos y vuelve a probar."],
  ])("traduce %s", (code, esperado) => {
    expect(mensajeErrorAuth({ code, message: "Internal detail" })).toBe(esperado);
  });

  it("trata el estado 429 como demasiados intentos", () => {
    expect(mensajeErrorAuth({ status: 429 })).toBe(
      "Demasiados intentos. Espera unos minutos y vuelve a probar.",
    );
  });

  it("no expone el mensaje original en errores desconocidos", () => {
    const mensaje = mensajeErrorAuth({
      code: "unexpected_failure",
      message: "relation auth.users does not exist",
    });
    expect(mensaje).toBe(MENSAJE_ERROR_GENERICO);
    expect(mensaje).not.toContain("relation");
  });

  it("no confunde propiedades heredadas con códigos", () => {
    expect(mensajeErrorAuth({ code: "toString" })).toBe(MENSAJE_ERROR_GENERICO);
  });

  it.each([null, undefined, "texto", 42, new Error("boom")])(
    "devuelve el genérico para %s",
    (valor) => {
      expect(mensajeErrorAuth(valor)).toBe(MENSAJE_ERROR_GENERICO);
    },
  );
});
