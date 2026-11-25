import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Buscador } from "./Buscador";

afterEach(() => {
  cleanup();
});

describe("Buscador", () => {
  it("envía q por GET a la ruta indicada", () => {
    render(<Buscador ruta="/ordenes" valor="" etiqueta="Buscar órdenes" />);
    const formulario = screen.getByRole("search");
    expect(formulario.getAttribute("action")).toBe("/ordenes");
    expect(formulario.getAttribute("method")).toBe("get");
    expect(screen.getByLabelText("Buscar órdenes").getAttribute("name")).toBe("q");
    expect(screen.queryByRole("link", { name: "Limpiar" })).toBeNull();
  });

  it("conserva los parámetros ocultos al buscar y al limpiar", () => {
    render(
      <Buscador ruta="/ordenes" valor="1234" etiqueta="Buscar" ocultos={{ estado: "listo" }} />,
    );
    const oculto = document.querySelector<HTMLInputElement>('input[type="hidden"][name="estado"]');
    expect(oculto?.value).toBe("listo");
    expect(screen.getByRole("link", { name: "Limpiar" }).getAttribute("href")).toBe(
      "/ordenes?estado=listo",
    );
  });
});
