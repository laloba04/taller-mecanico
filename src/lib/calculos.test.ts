import { describe, expect, it } from "vitest";
import {
  cantidadACentesimas,
  centesimasACantidad,
  eurosACentimos,
  importeLinea,
  importeLineaSeguro,
  totalesOrden,
  totalesOrdenSeguros,
  type LineaCalculo,
} from "./calculos";

describe("eurosACentimos", () => {
  it.each([
    ["12", 1200],
    ["12,5", 1250],
    ["12,50", 1250],
    ["12,05", 1205],
    ["0,01", 1],
    ["0", 0],
    ["1.234,56", 123456],
    ["1.234.567,89", 123456789],
    ["1.234", 123400],
    ["12.50", 1250],
    ["12.5", 1250],
    ["  45,90  ", 4590],
    ["45,90 €", 4590],
    ["45,90€", 4590],
    ["007", 700],
  ])("%s → %i céntimos", (texto, esperado) => {
    expect(eurosACentimos(texto)).toBe(esperado);
  });

  it.each([
    "",
    "   ",
    "-12",
    "-0,50",
    "+12",
    "12,345",
    "12.345,678",
    "12.345.6",
    "1,2,3",
    "12,",
    ",50",
    "12.",
    "1.23.45",
    "12,5a",
    "abc",
    "1e3",
    "Infinity",
    "NaN",
    "12 50",
    "99999999999999999",
  ])("rechaza %j", (texto) => {
    expect(eurosACentimos(texto)).toBeNull();
  });
});

describe("cantidadACentesimas", () => {
  it("convierte texto con coma o punto decimal", () => {
    expect(cantidadACentesimas("1")).toBe(100);
    expect(cantidadACentesimas("1,5")).toBe(150);
    expect(cantidadACentesimas("0,25")).toBe(25);
    expect(cantidadACentesimas("2.75")).toBe(275);
    expect(cantidadACentesimas("1.000")).toBe(100000);
  });

  it("convierte números de la BD sin errores de coma flotante", () => {
    expect(cantidadACentesimas(1.5)).toBe(150);
    expect(cantidadACentesimas(0.29)).toBe(29); // 0.29 * 100 = 28.999999999999996
    expect(cantidadACentesimas(1.15)).toBe(115);
    expect(cantidadACentesimas(3)).toBe(300);
    expect(cantidadACentesimas(99999999.99)).toBe(9999999999);
  });

  it("rechaza más de 2 decimales, negativos y valores no finitos", () => {
    expect(cantidadACentesimas("1,505")).toBeNull();
    expect(cantidadACentesimas(1.005)).toBeNull();
    expect(cantidadACentesimas(0.1 + 0.2)).toBeNull();
    expect(cantidadACentesimas(-1)).toBeNull();
    expect(cantidadACentesimas("-1")).toBeNull();
    expect(cantidadACentesimas(Number.NaN)).toBeNull();
    expect(cantidadACentesimas(Number.POSITIVE_INFINITY)).toBeNull();
    expect(cantidadACentesimas(1e21)).toBeNull();
    expect(cantidadACentesimas("")).toBeNull();
    expect(cantidadACentesimas("dos")).toBeNull();
  });
});

describe("centesimasACantidad", () => {
  it("pasa de centésimas a unidades", () => {
    expect(centesimasACantidad(150)).toBe(1.5);
    expect(centesimasACantidad(29)).toBe(0.29);
  });

  it("rechaza valores no enteros o negativos", () => {
    expect(() => centesimasACantidad(1.5)).toThrow(RangeError);
    expect(() => centesimasACantidad(-1)).toThrow(RangeError);
  });
});

describe("importeLinea", () => {
  it("multiplica cantidad entera por precio", () => {
    expect(importeLinea(2, 4590)).toBe(9180);
    expect(importeLinea("3", 0)).toBe(0);
  });

  it("1,5 h × 33,33 € = 49,995 € → 50,00 € (redondeo de ,5 hacia arriba)", () => {
    expect(importeLinea(1.5, 3333)).toBe(5000);
    expect(importeLinea("1,5", 3333)).toBe(5000);
  });

  it("redondea en los límites de medio céntimo", () => {
    expect(importeLinea(0.5, 1)).toBe(1); // 0,5 céntimos → 1
    expect(importeLinea(0.49, 1)).toBe(0); // 0,49 céntimos → 0
    expect(importeLinea(0.51, 1)).toBe(1);
    expect(importeLinea(1.15, 115)).toBe(132); // 132,25 → 132
    expect(importeLinea(0.25, 2)).toBe(1); // 0,5 → 1
    expect(importeLinea(0.75, 2)).toBe(2); // 1,5 → 2
  });

  it("no pierde precisión con cantidades y precios grandes", () => {
    // 12.345.678,91 × 77.777,77 € = 96.021.937.475.583,07 céntimos (exacto con BigInt)
    expect(importeLinea(12345678.91, 7777777)).toBe(96021937475583);
    // 9.999,99 × 999.999,99 € = 999.998.990.000,01 céntimos → 999.998.990.000
    expect(importeLinea("9.999,99", 99999999)).toBe(999998990000);
  });

  it("lanza si el resultado no cabe en un entero seguro", () => {
    expect(() => importeLinea(99999999.99, 2147483647)).toThrow(RangeError);
  });

  it("lanza con cantidades o precios no válidos", () => {
    expect(() => importeLinea(1.005, 100)).toThrow(RangeError);
    expect(() => importeLinea(-1, 100)).toThrow(RangeError);
    expect(() => importeLinea(1, 12.5)).toThrow(RangeError);
    expect(() => importeLinea(1, -100)).toThrow(RangeError);
  });
});

describe("totalesOrden", () => {
  it("devuelve todo a cero sin líneas", () => {
    expect(totalesOrden([], 21)).toEqual({
      piezas: 0,
      manoObra: 0,
      baseImponible: 0,
      iva: 0,
      total: 0,
    });
  });

  const lineas: LineaCalculo[] = [
    { tipo: "pieza", cantidad: 2, precio_unitario_centimos: 4590 }, // 91,80 €
    { tipo: "pieza", cantidad: "1", precio_unitario_centimos: 1235 }, // 12,35 €
    { tipo: "mano_obra", cantidad: 1.5, precio_unitario_centimos: 3333 }, // 50,00 €
  ];

  it("separa piezas y mano de obra y aplica IVA 21 %", () => {
    // base 154,15 € → IVA 32,3715 € → 32,37 €
    expect(totalesOrden(lineas, 21)).toEqual({
      piezas: 10415,
      manoObra: 5000,
      baseImponible: 15415,
      iva: 3237,
      total: 18652,
    });
  });

  it("aplica IVA 10 %", () => {
    // 15,415 € → 15,42 € (el ,5 sube)
    expect(totalesOrden(lineas, 10)).toMatchObject({ baseImponible: 15415, iva: 1542, total: 16957 });
  });

  it("aplica IVA 4 %", () => {
    // 6,166 € → 6,17 €
    expect(totalesOrden(lineas, 4)).toMatchObject({ iva: 617, total: 16032 });
  });

  it("aplica IVA 0 %", () => {
    expect(totalesOrden(lineas, 0)).toMatchObject({ baseImponible: 15415, iva: 0, total: 15415 });
  });

  it("redondea el IVA en el límite de medio céntimo hacia arriba", () => {
    const una = (precio: number): LineaCalculo[] => [
      { tipo: "pieza", cantidad: 1, precio_unitario_centimos: precio },
    ];
    expect(totalesOrden(una(50), 21).iva).toBe(11); // 10,5 → 11
    expect(totalesOrden(una(150), 21).iva).toBe(32); // 31,5 → 32
    expect(totalesOrden(una(2), 21).iva).toBe(0); // 0,42 → 0
    expect(totalesOrden(una(5), 10).iva).toBe(1); // 0,5 → 1
    expect(totalesOrden(una(4), 10).iva).toBe(0); // 0,4 → 0
  });

  it("redondea cada línea antes de sumar", () => {
    const medias: LineaCalculo[] = [
      { tipo: "mano_obra", cantidad: 0.5, precio_unitario_centimos: 1 },
      { tipo: "mano_obra", cantidad: 0.5, precio_unitario_centimos: 1 },
    ];
    expect(totalesOrden(medias, 0).manoObra).toBe(2);
  });

  it("no pierde precisión con importes grandes", () => {
    const grandes: LineaCalculo[] = [
      { tipo: "pieza", cantidad: 12345678.91, precio_unitario_centimos: 7777777 },
    ];
    expect(totalesOrden(grandes, 21)).toEqual({
      piezas: 96021937475583,
      manoObra: 0,
      baseImponible: 96021937475583,
      iva: 20164606869872,
      total: 116186544345455,
    });
  });

  it("muchas líneas pequeñas suman exacto (sin errores de coma flotante)", () => {
    const decimas: LineaCalculo[] = Array.from({ length: 1000 }, () => ({
      tipo: "pieza" as const,
      cantidad: 0.1,
      precio_unitario_centimos: 10,
    }));
    expect(totalesOrden(decimas, 21)).toMatchObject({ piezas: 1000, iva: 210, total: 1210 });
  });

  it("rechaza porcentajes de IVA no válidos", () => {
    expect(() => totalesOrden([], -1)).toThrow(RangeError);
    expect(() => totalesOrden([], 101)).toThrow(RangeError);
    expect(() => totalesOrden([], 10.5)).toThrow(RangeError);
  });
});

describe("totalesOrdenSeguros", () => {
  it("devuelve los mismos totales que totalesOrden", () => {
    const lineas: LineaCalculo[] = [{ tipo: "pieza", cantidad: 1, precio_unitario_centimos: 1000 }];
    expect(totalesOrdenSeguros(lineas, 21)).toEqual(totalesOrden(lineas, 21));
  });

  it("devuelve null con datos no válidos en lugar de lanzar", () => {
    expect(totalesOrdenSeguros([], 150)).toBeNull();
    expect(
      totalesOrdenSeguros([{ tipo: "pieza", cantidad: 99999999.99, precio_unitario_centimos: 2147483647 }], 21),
    ).toBeNull();
  });
});

describe("importeLineaSeguro", () => {
  it("devuelve el importe o null si los datos no son válidos", () => {
    expect(importeLineaSeguro(1.5, 3333)).toBe(5000);
    expect(importeLineaSeguro(-1, 100)).toBeNull();
    expect(importeLineaSeguro(99999999.99, 2147483647)).toBeNull();
  });
});
