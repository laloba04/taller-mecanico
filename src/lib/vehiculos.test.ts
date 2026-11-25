import { describe, expect, it } from "vitest";
import { erroresPorCampo } from "./auth";
import { anioMaximo, esquemaVehiculo, filtroVehiculos } from "./vehiculos";

const CLIENTE = "3f1c2a4e-8b7d-4c3a-9f2e-1a2b3c4d5e6f";

const base = {
  cliente_id: CLIENTE,
  matricula: "1234 bcd",
  marca: "",
  modelo: "",
  anio: "",
  kilometros: "",
};

function errores(datos: Record<string, unknown>) {
  const r = esquemaVehiculo.safeParse({ ...base, ...datos });
  if (r.success) throw new Error("Se esperaba un error de validación");
  return erroresPorCampo(r.error);
}

describe("esquemaVehiculo", () => {
  it("acepta valores de formulario y normaliza la matrícula", () => {
    const r = esquemaVehiculo.safeParse({
      cliente_id: CLIENTE,
      matricula: "m-1234-ab",
      marca: " Seat ",
      modelo: "Ibiza",
      anio: "2018",
      kilometros: "150.000",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).toEqual({
        cliente_id: CLIENTE,
        matricula: "M1234AB",
        marca: "Seat",
        modelo: "Ibiza",
        anio: 2018,
        kilometros: 150000,
      });
    }
  });

  it("convierte opcionales vacíos o ausentes en null", () => {
    const r = esquemaVehiculo.safeParse({ cliente_id: CLIENTE, matricula: "1234BCD" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.marca).toBeNull();
      expect(r.data.modelo).toBeNull();
      expect(r.data.anio).toBeNull();
      expect(r.data.kilometros).toBeNull();
    }
    const r2 = esquemaVehiculo.safeParse(base);
    expect(r2.success).toBe(true);
    if (r2.success) expect(r2.data.matricula).toBe("1234BCD");
  });

  it("exige un cliente válido", () => {
    expect(errores({ cliente_id: "" }).cliente_id).toBe("Elige un cliente.");
    expect(errores({ cliente_id: "no-uuid" }).cliente_id).toBe("Elige un cliente.");
  });

  it("exige y valida la matrícula", () => {
    expect(errores({ matricula: "" }).matricula).toBe("Introduce la matrícula.");
    expect(errores({ matricula: " - " }).matricula).toBe("Introduce la matrícula.");
    expect(errores({ matricula: "12#4bcd" }).matricula).toMatch(/^Matrícula no válida/);
    expect(errores({ matricula: "123456" }).matricula).toMatch(/^Matrícula no válida/);
    expect(errores({ matricula: undefined }).matricula).toBe("Introduce la matrícula.");
  });

  it("limita marca y modelo a 60 caracteres", () => {
    expect(errores({ marca: "a".repeat(61) }).marca).toBe(
      "La marca no puede superar 60 caracteres.",
    );
    expect(errores({ modelo: "a".repeat(61) }).modelo).toBe(
      "El modelo no puede superar 60 caracteres.",
    );
  });

  it("valida el año entre 1900 y el año que viene", () => {
    expect(esquemaVehiculo.safeParse({ ...base, anio: "1900" }).success).toBe(true);
    expect(esquemaVehiculo.safeParse({ ...base, anio: String(anioMaximo()) }).success).toBe(true);
    expect(errores({ anio: "1899" }).anio).toMatch(/1900/);
    expect(errores({ anio: String(anioMaximo() + 1) }).anio).toMatch(/posterior/);
    expect(errores({ anio: "dos mil" }).anio).toBe("El año debe ser un número entero.");
    expect(errores({ anio: "2020,5" }).anio).toBe("El año debe ser un número entero.");
  });

  it("valida los kilómetros", () => {
    expect(esquemaVehiculo.safeParse({ ...base, kilometros: "0" }).success).toBe(true);
    expect(esquemaVehiculo.safeParse({ ...base, kilometros: "9999999" }).success).toBe(true);
    expect(errores({ kilometros: "-1" }).kilometros).toBe("Los kilómetros no pueden ser negativos.");
    expect(errores({ kilometros: "10000000" }).kilometros).toMatch(/9\.999\.999/);
    expect(errores({ kilometros: "12,5" }).kilometros).toBe(
      "Los kilómetros deben ser un número entero.",
    );
  });
});

describe("anioMaximo", () => {
  it("es el año siguiente al de la fecha dada", () => {
    expect(anioMaximo(new Date(2026, 10, 25))).toBe(2027);
  });
});

describe("filtroVehiculos", () => {
  it("busca la matrícula normalizada y el texto original en marca y modelo", () => {
    const filtro = filtroVehiculos("1234 bcd");
    expect(filtro).toBe(
      'matricula.ilike."%1234BCD%",marca.ilike."%1234 bcd%",modelo.ilike."%1234 bcd%"',
    );
  });

  it("normaliza guiones y minúsculas de la matrícula", () => {
    const filtro = filtroVehiculos("m-1234-ab");
    expect(filtro).toContain('matricula.ilike."%M1234AB%"');
    expect(filtro).not.toContain('matricula.ilike."%m-1234-ab%"');
  });

  it("devuelve null si no hay nada que buscar", () => {
    expect(filtroVehiculos("  ")).toBeNull();
    expect(filtroVehiculos("")).toBeNull();
  });

  it("solo busca en marca y modelo si la matrícula normalizada queda vacía", () => {
    expect(filtroVehiculos(" - ")).toBe('marca.ilike."%-%",modelo.ilike."%-%"');
  });

  it("mantiene escapados comas, paréntesis, comillas y comodines", () => {
    expect(filtroVehiculos('a,b(c)"')).toBe(
      'matricula.ilike."%A,B(C)\\"%",marca.ilike."%a,b(c)\\"%",modelo.ilike."%a,b(c)\\"%"',
    );
    // patronBusqueda escapa % y _ con "\" y filtroOrIlike duplica esa barra dentro de las comillas.
    expect(filtroVehiculos("50%_x")).toContain('matricula.ilike."%50\\\\%\\\\_X%"');
  });
});
