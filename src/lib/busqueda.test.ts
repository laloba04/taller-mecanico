import { describe, expect, it } from "vitest";
import {
  LONGITUD_MAXIMA_BUSQUEDA,
  MENSAJE_ERROR_BD_GENERICO,
  MENSAJE_ESTADO_ORDEN_NO_PERMITIDO,
  filtroOrIlike,
  mensajeErrorBD,
  patronBusqueda,
} from "./busqueda";

describe("patronBusqueda", () => {
  it("rodea el texto recortado con %", () => {
    expect(patronBusqueda("  ana  ")).toBe("%ana%");
  });

  it("devuelve null si no hay texto", () => {
    expect(patronBusqueda("")).toBeNull();
    expect(patronBusqueda("   ")).toBeNull();
    expect(patronBusqueda(null)).toBeNull();
    expect(patronBusqueda(undefined)).toBeNull();
    expect(patronBusqueda("**")).toBeNull();
  });

  it("escapa %, _ y la barra invertida", () => {
    expect(patronBusqueda("50%")).toBe("%50\\%%");
    expect(patronBusqueda("a_b")).toBe("%a\\_b%");
    expect(patronBusqueda("c\\d")).toBe("%c\\\\d%");
  });

  it("quita los asteriscos", () => {
    expect(patronBusqueda("a*b")).toBe("%ab%");
  });

  it("limita la longitud", () => {
    expect(patronBusqueda("x".repeat(500))).toBe(`%${"x".repeat(LONGITUD_MAXIMA_BUSQUEDA)}%`);
  });
});

describe("filtroOrIlike", () => {
  it("genera una condición por columna con el valor entre comillas", () => {
    expect(filtroOrIlike(["nombre", "email"], "%ana%")).toBe(
      'nombre.ilike."%ana%",email.ilike."%ana%"',
    );
  });

  it("escapa comillas y barras dentro del valor", () => {
    expect(filtroOrIlike(["nombre"], '%a"b\\%%')).toBe('nombre.ilike."%a\\"b\\\\%%"');
  });

  it("mantiene comas y paréntesis dentro de las comillas", () => {
    expect(filtroOrIlike(["nombre"], "%a,b(c)%")).toBe('nombre.ilike."%a,b(c)%"');
  });
});

describe("mensajeErrorBD", () => {
  it("traduce matrícula duplicada en vehículos", () => {
    expect(mensajeErrorBD({ code: "23505", message: "duplicate key value" }, "vehiculo")).toBe(
      "Ya existe un vehículo con esa matrícula.",
    );
  });

  it("traduce duplicado genérico fuera de vehículos", () => {
    expect(mensajeErrorBD({ code: "23505" }, "cliente")).toBe(
      "Ya existe un registro con esos datos.",
    );
  });

  it("traduce clave foránea inexistente", () => {
    expect(mensajeErrorBD({ code: "23503" }, "vehiculo")).toBe("El cliente indicado no existe.");
  });

  it("traduce clave foránea inexistente en órdenes y líneas", () => {
    expect(mensajeErrorBD({ code: "23503" }, "orden")).toBe("El vehículo indicado no existe.");
    expect(mensajeErrorBD({ code: "23503" }, "linea")).toBe("La orden indicada no existe.");
  });

  it("traduce el rechazo de los triggers de estado sin exponer el mensaje", () => {
    const error = { code: "P0001", message: "transicion_orden_no_permitida" };
    expect(mensajeErrorBD(error, "orden")).toBe(
      "Esa operación no está permitida en el estado actual de la orden.",
    );
    expect(mensajeErrorBD(error, "linea")).toBe(MENSAJE_ESTADO_ORDEN_NO_PERMITIDO);
    expect(mensajeErrorBD(error)).not.toContain("transicion");
  });

  it("traduce violaciones de formato", () => {
    expect(mensajeErrorBD({ code: "23514" })).toBe("Algún dato no tiene un formato válido.");
  });

  it("devuelve el genérico para el resto y nunca el mensaje original", () => {
    const interno = { code: "42501", message: "new row violates row-level security policy" };
    expect(mensajeErrorBD(interno)).toBe(MENSAJE_ERROR_BD_GENERICO);
    expect(mensajeErrorBD(interno)).not.toContain("row-level");
    expect(mensajeErrorBD(null)).toBe(MENSAJE_ERROR_BD_GENERICO);
    expect(mensajeErrorBD("texto")).toBe(MENSAJE_ERROR_BD_GENERICO);
  });
});
