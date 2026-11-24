import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ListaResponsive, type ColumnaLista } from "./ListaResponsive";

type Cliente = { id: string; nombre: string; telefono: string };

const clientes: Cliente[] = [
  { id: "1", nombre: "Ana López", telefono: "600111222" },
  { id: "2", nombre: "Luis Pérez", telefono: "600333444" },
];

const columnas: ColumnaLista<Cliente>[] = [
  { titulo: "Nombre", celda: (c) => c.nombre },
  { titulo: "Teléfono", celda: (c) => c.telefono },
];

afterEach(() => {
  cleanup();
});

describe("ListaResponsive", () => {
  it("renderiza una tarjeta por elemento con título de columna y valor", () => {
    render(<ListaResponsive elementos={clientes} columnas={columnas} clave={(c) => c.id} />);

    const tarjetas = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(tarjetas).toHaveLength(2);
    expect(within(tarjetas[0]).getByText("Nombre")).toBeTruthy();
    expect(within(tarjetas[0]).getByText("Ana López")).toBeTruthy();
    expect(within(tarjetas[1]).getByText("600333444")).toBeTruthy();
  });

  it("renderiza una tabla con cabeceras y una fila por elemento", () => {
    render(<ListaResponsive elementos={clientes} columnas={columnas} clave={(c) => c.id} />);

    const tabla = screen.getByRole("table");
    const cabeceras = within(tabla).getAllByRole("columnheader");
    expect(cabeceras.map((c) => c.textContent)).toEqual(["Nombre", "Teléfono"]);
    const filas = within(tabla).getAllByRole("row");
    expect(filas).toHaveLength(3); // cabecera + 2 filas
    expect(within(filas[2]).getByText("Luis Pérez")).toBeTruthy();
  });

  it("muestra el mensaje vacío personalizado y no renderiza tabla", () => {
    render(
      <ListaResponsive
        elementos={[]}
        columnas={columnas}
        clave={(c) => c.id}
        vacio="Todavía no hay clientes."
      />,
    );

    expect(screen.getByText("Todavía no hay clientes.")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("usa un mensaje vacío por defecto en español", () => {
    render(<ListaResponsive elementos={[]} columnas={columnas} clave={(c) => c.id} />);
    expect(screen.getByText("No hay elementos.")).toBeTruthy();
  });
});
