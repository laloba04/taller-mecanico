import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BotonEliminar } from "./BotonEliminar";

afterEach(() => {
  cleanup();
});

const ID = "3f1c2a4e-8b7d-4c3a-9f2e-1a2b3c4d5e6f";

describe("BotonEliminar", () => {
  it("pide confirmación antes de mostrar el botón que elimina", () => {
    const accion = vi.fn(async () => ({}));
    render(
      <BotonEliminar accion={accion} id={ID} texto="Eliminar cliente" aviso="Se borrará todo." />,
    );

    expect(screen.queryByText("Se borrará todo.")).toBeNull();
    expect(screen.queryByRole("button", { name: "Sí, eliminar" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Eliminar cliente" }));

    expect(screen.getByText("Se borrará todo.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sí, eliminar" })).toBeTruthy();
    const oculto = document.querySelector<HTMLInputElement>('input[name="id"]');
    expect(oculto?.value).toBe(ID);
    expect(accion).not.toHaveBeenCalled();
  });

  it("vuelve al estado inicial al cancelar", () => {
    render(
      <BotonEliminar accion={async () => ({})} id={ID} texto="Eliminar" aviso="Aviso" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByText("Aviso")).toBeNull();
    expect(screen.getByRole("button", { name: "Eliminar" })).toBeTruthy();
  });
});
