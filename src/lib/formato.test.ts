import { describe, expect, it } from "vitest";
import { formatEuro } from "./formato";

const normaliza = (s: string) => s.replace(/\s/g, " ");

describe("formatEuro", () => {
  it("formatea céntimos como euros con dos decimales", () => {
    expect(normaliza(formatEuro(1234567))).toBe("12.345,67 €");
  });

  it("formatea cero", () => {
    expect(normaliza(formatEuro(0))).toBe("0,00 €");
  });

  it("formatea negativos", () => {
    expect(normaliza(formatEuro(-550))).toBe("-5,50 €");
  });
});
