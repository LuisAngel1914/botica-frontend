import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import VentasView from "./VentasView.vue";
import api from "../api/axios";

vi.mock("../api/axios", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));
vi.mock("../composables/useAuth", async () => {
  const { ref } = await import("vue");
  return { useAuth: () => ({ isAdmin: ref(true) }) };
});

const sale = {
  id: 21,
  created_at: "2026-09-30T12:00:00Z",
  estado: "completada",
  metodo_pago: "Efectivo",
  total: 20,
  cliente: {
    nombre_razon_social: "Cliente de aceptación",
    numero_documento: "42092755",
  },
  devoluciones: [],
  detalles: [
    {
      id: 31,
      cantidad: 2,
      precio_unitario: 10,
      producto: { nombre: "Producto de aceptación" },
      asignaciones: [
        { cantidad: 2, lote: { numero_lote: "E2E-LOTE-01" } },
      ],
      devoluciones: [],
    },
  ],
};

let wrapper;

function salesResponse(items = [sale]) {
  return {
    data: {
      data: items,
      current_page: 1,
      last_page: 1,
      total: items.length,
      from: items.length ? 1 : 0,
      to: items.length,
    },
  };
}

async function start() {
  api.get.mockResolvedValue(salesResponse());
  wrapper = mount(VentasView, {
    global: {
      stubs: { AppDialog: { template: "<div><slot /></div>" } },
    },
  });
  await flushPromises();
  return wrapper;
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  wrapper?.unmount();
});

describe("Sales traceability actions", () => {
  it("renders a dedicated mobile list without replacing the desktop table", async () => {
    await start();

    const mobileList = wrapper.get('[data-testid="mobile-sales-list"]');
    const desktopTable = wrapper.get('[data-testid="desktop-sales-table"]');

    expect(mobileList.classes()).toContain("md:hidden");
    expect(mobileList.text()).toContain("Venta #21");
    expect(mobileList.text()).toContain("Cliente de aceptación");
    expect(mobileList.text()).toContain("42092755");
    expect(mobileList.text()).toContain("S/ 20.00");
    expect(mobileList.text()).toContain("Ver detalle");
    expect(desktopTable.classes()).toContain("md:block");
    expect(desktopTable.find("table").exists()).toBe(true);
  });

  it("downloads the selected operation with an explicit internal-ticket name", async () => {
    await start();
    api.get.mockResolvedValueOnce({ data: "<html>ticket</html>" });
    const anchor = { href: "", download: "", click: vi.fn() };
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag, options) =>
      tag === "a" ? anchor : createElement(tag, options),
    );
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:ticket"),
      revokeObjectURL: vi.fn(),
    });

    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Ticket interno")
      .trigger("click");
    await flushPromises();

    expect(api.get).toHaveBeenLastCalledWith("/ventas/21/ticket", {
      responseType: "blob",
    });
    expect(anchor.download).toBe("ticket-interno-venta-21.html");
    expect(anchor.click).toHaveBeenCalledOnce();
  });

  it("registers a partial return with its reason and exact detail quantity", async () => {
    await start();
    api.post.mockResolvedValue({ data: { message: "Registrada" } });

    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Devolver")
      .trigger("click");
    await wrapper
      .get('input[aria-label="Cantidad a devolver de Producto de aceptación"]')
      .setValue("1");
    await wrapper
      .get('textarea[aria-label="Motivo de devolución"]')
      .setValue("Producto devuelto en buen estado.");
    await wrapper.findAll("form").at(-1).trigger("submit");
    await flushPromises();

    expect(api.post).toHaveBeenCalledWith("/ventas/21/devoluciones", {
      motivo: "Producto devuelto en buen estado.",
      detalles: [{ detalle_venta_id: 31, cantidad: 1 }],
    });
    expect(wrapper.text()).toContain(
      "Devolución registrada, caja e inventario actualizados",
    );
  });

  it("annuls a sale only after recording an auditable reason", async () => {
    await start();
    api.post.mockResolvedValue({ data: { message: "Anulada" } });

    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Anular")
      .trigger("click");
    await wrapper
      .get('textarea[aria-label="Motivo de anulación"]')
      .setValue("Error de cobro confirmado por administración.");
    await wrapper.findAll("form").at(-1).trigger("submit");
    await flushPromises();

    expect(api.post).toHaveBeenCalledWith("/ventas/21/anular", {
      motivo: "Error de cobro confirmado por administración.",
    });
    expect(wrapper.text()).toContain("Venta anulada y stock repuesto");
  });
});
