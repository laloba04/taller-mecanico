import { describe, expect, it } from "vitest";
import { erroresPorCampo } from "./auth";
import {
  esquemaActualizarOrden,
  esquemaAvanzarEstado,
  esquemaCrearOrden,
  esquemaLinea,
  estadoDesdeParametro,
  hrefListadoOrdenes,
  patronesBusquedaOrden,
} from "./ordenes";

const ID = "3f1c2a4e-8b7d-4c3a-9f2e-1a2b3c4d5e6f";

function erroresDe(r: { success: boolean; error?: unknown }): Record<string, string> {
  if (r.success) throw new Error("Se esperaba un error de validación");
  return erroresPorCampo(r.error as Parameters<typeof erroresPorCampo>[0]);
}

describe("esquemaCrearOrden", () => {
  it("acepta un formulario válido", () => {
    const r = esquemaCrearOrden.safeParse({
      vehiculo_id: ID,
      descripcion: "  Cambio de aceite  ",
      iva_porcentaje: "21",
    });
    expect(r.success && r.data).toEqual({
      vehiculo_id: ID,
      descripcion: "Cambio de aceite",
      iva_porcentaje: 21,
    });
  });

  it("guarda la descripción vacía como null y admite IVA 0", () => {
    const r = esquemaCrearOrden.safeParse({ vehiculo_id: ID, descripcion: "  ", iva_porcentaje: "0" });
    expect(r.success && r.data).toMatchObject({ descripcion: null, iva_porcentaje: 0 });
  });

  it("exige un vehículo válido", () => {
    const e = erroresDe(
      esquemaCrearOrden.safeParse({ vehiculo_id: "", descripcion: "", iva_porcentaje: "21" }),
    );
    expect(e.vehiculo_id).toBe("Elige un vehículo.");
  });

  it("limita la descripción a 2000 caracteres", () => {
    const ok = esquemaCrearOrden.safeParse({
      vehiculo_id: ID,
      descripcion: "x".repeat(2000),
      iva_porcentaje: "21",
    });
    expect(ok.success).toBe(true);
    const e = erroresDe(
      esquemaCrearOrden.safeParse({
        vehiculo_id: ID,
        descripcion: "x".repeat(2001),
        iva_porcentaje: "21",
      }),
    );
    expect(e.descripcion).toContain("2000");
  });

  it.each([
    ["", "Elige el tipo de IVA."],
    ["-1", "El IVA debe estar entre 0 y 100."],
    ["101", "El IVA debe estar entre 0 y 100."],
    ["10,5", "Elige el tipo de IVA."],
    ["abc", "Elige el tipo de IVA."],
  ])("rechaza el IVA %j", (iva, mensaje) => {
    const e = erroresDe(
      esquemaCrearOrden.safeParse({ vehiculo_id: ID, descripcion: "", iva_porcentaje: iva }),
    );
    expect(e.iva_porcentaje).toBe(mensaje);
  });
});

describe("esquemaActualizarOrden", () => {
  it("valida id, descripción e IVA", () => {
    const r = esquemaActualizarOrden.safeParse({ id: ID, descripcion: "Frenos", iva_porcentaje: "10" });
    expect(r.success && r.data).toEqual({ id: ID, descripcion: "Frenos", iva_porcentaje: 10 });
  });

  it("rechaza un id no válido", () => {
    const e = erroresDe(
      esquemaActualizarOrden.safeParse({ id: "1", descripcion: "", iva_porcentaje: "21" }),
    );
    expect(e.id).toBeDefined();
  });
});

describe("esquemaLinea", () => {
  const base = {
    orden_id: ID,
    tipo: "mano_obra",
    descripcion: " Diagnosis ",
    cantidad: "1,5",
    precio: "33,33",
  };

  it("convierte cantidad a centésimas y precio a céntimos", () => {
    const r = esquemaLinea.safeParse(base);
    expect(r.success && r.data).toEqual({
      orden_id: ID,
      tipo: "mano_obra",
      descripcion: "Diagnosis",
      cantidad: 150,
      precio: 3333,
    });
  });

  it("acepta precio 0 y formatos con miles", () => {
    const r = esquemaLinea.safeParse({ ...base, tipo: "pieza", cantidad: "2", precio: "1.234,50" });
    expect(r.success && r.data).toMatchObject({ tipo: "pieza", cantidad: 200, precio: 123450 });
    const gratis = esquemaLinea.safeParse({ ...base, precio: "0" });
    expect(gratis.success && gratis.data.precio).toBe(0);
  });

  it("rechaza tipo desconocido", () => {
    expect(erroresDe(esquemaLinea.safeParse({ ...base, tipo: "otro" })).tipo).toBe(
      "Elige pieza o mano de obra.",
    );
  });

  it("exige descripción de 1 a 200 caracteres", () => {
    expect(erroresDe(esquemaLinea.safeParse({ ...base, descripcion: "   " })).descripcion).toBe(
      "Introduce la descripción.",
    );
    expect(
      erroresDe(esquemaLinea.safeParse({ ...base, descripcion: "x".repeat(201) })).descripcion,
    ).toContain("200");
    expect(esquemaLinea.safeParse({ ...base, descripcion: "x".repeat(200) }).success).toBe(true);
  });

  it.each([
    ["", "Introduce la cantidad."],
    ["0", "La cantidad debe ser mayor que 0."],
    ["0,00", "La cantidad debe ser mayor que 0."],
    ["-1", "Cantidad no válida: usa un número con hasta 2 decimales (p. ej. 1,5)."],
    ["1,555", "Cantidad no válida: usa un número con hasta 2 decimales (p. ej. 1,5)."],
    ["dos", "Cantidad no válida: usa un número con hasta 2 decimales (p. ej. 1,5)."],
    ["10.000", "La cantidad no puede superar 9.999,99."],
  ])("rechaza la cantidad %j", (cantidad, mensaje) => {
    expect(erroresDe(esquemaLinea.safeParse({ ...base, cantidad })).cantidad).toBe(mensaje);
  });

  it.each([
    ["", "Introduce el precio."],
    ["-5", "Precio no válido: usa euros con hasta 2 decimales (p. ej. 45,90)."],
    ["12,345", "Precio no válido: usa euros con hasta 2 decimales (p. ej. 45,90)."],
    ["1.000.000", "El precio no puede superar 999.999,99 €."],
  ])("rechaza el precio %j", (precio, mensaje) => {
    expect(erroresDe(esquemaLinea.safeParse({ ...base, precio })).precio).toBe(mensaje);
  });

  it("acepta los máximos", () => {
    const r = esquemaLinea.safeParse({ ...base, cantidad: "9.999,99", precio: "999.999,99" });
    expect(r.success && r.data).toMatchObject({ cantidad: 999999, precio: 99999999 });
  });
});

describe("esquemaAvanzarEstado", () => {
  it("acepta id y estado actual", () => {
    expect(esquemaAvanzarEstado.safeParse({ id: ID, estado: "listo" }).success).toBe(true);
  });

  it("rechaza estado desconocido o id no válido", () => {
    expect(esquemaAvanzarEstado.safeParse({ id: ID, estado: "cancelado" }).success).toBe(false);
    expect(esquemaAvanzarEstado.safeParse({ id: "x", estado: "recibido" }).success).toBe(false);
  });
});

describe("estadoDesdeParametro", () => {
  it("devuelve el estado si es válido y null si no", () => {
    expect(estadoDesdeParametro("listo")).toBe("listo");
    expect(estadoDesdeParametro("todos")).toBeNull();
    expect(estadoDesdeParametro(undefined)).toBeNull();
    expect(estadoDesdeParametro(["listo"])).toBeNull();
  });
});

describe("hrefListadoOrdenes", () => {
  it("construye el enlace con los filtros presentes", () => {
    expect(hrefListadoOrdenes({})).toBe("/ordenes");
    expect(hrefListadoOrdenes({ estado: "listo" })).toBe("/ordenes?estado=listo");
    expect(hrefListadoOrdenes({ estado: null, q: " 1234 BCD " })).toBe("/ordenes?q=1234+BCD");
    expect(hrefListadoOrdenes({ estado: "entregado", q: "Ana & Luis" })).toBe(
      "/ordenes?estado=entregado&q=Ana+%26+Luis",
    );
  });
});

describe("patronesBusquedaOrden", () => {
  it("normaliza la matrícula (D12) y deja el nombre tal cual", () => {
    expect(patronesBusquedaOrden("1234 bcd")).toEqual({
      matricula: "%1234BCD%",
      nombre: "%1234 bcd%",
    });
    expect(patronesBusquedaOrden("m-1234-ab")).toMatchObject({ matricula: "%M1234AB%" });
  });

  it("escapa comodines", () => {
    expect(patronesBusquedaOrden("ana_50%")).toEqual({
      matricula: "%ANA\\_50\\%%",
      nombre: "%ana\\_50\\%%",
    });
  });

  it("devuelve null si no hay nada que buscar", () => {
    expect(patronesBusquedaOrden("")).toBeNull();
    expect(patronesBusquedaOrden("   ")).toBeNull();
  });

  it("busca solo por nombre si el texto queda vacío al normalizar la matrícula", () => {
    expect(patronesBusquedaOrden(" - ")).toEqual({ matricula: null, nombre: "%-%" });
  });
});
