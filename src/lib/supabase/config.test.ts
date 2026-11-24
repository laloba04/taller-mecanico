import { describe, expect, it } from "vitest";
import { validarConfigSupabase } from "./config";

describe("validarConfigSupabase", () => {
  it("devuelve la configuración cuando ambas variables existen", () => {
    expect(validarConfigSupabase(" https://x.supabase.co ", "clave")).toEqual({
      url: "https://x.supabase.co",
      anonKey: "clave",
    });
  });

  it("lanza un error en español si falta la URL", () => {
    expect(() => validarConfigSupabase(undefined, "clave")).toThrow(
      /Falta configurar Supabase: define NEXT_PUBLIC_SUPABASE_URL en/,
    );
  });

  it("lanza un error si falta la clave anónima", () => {
    expect(() => validarConfigSupabase("https://x.supabase.co", "")).toThrow(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    );
  });

  it("nombra ambas variables si faltan las dos", () => {
    expect(() => validarConfigSupabase("  ", undefined)).toThrow(
      "Falta configurar Supabase: define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local (o en Vercel).",
    );
  });
});
