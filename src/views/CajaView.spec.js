import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import CajaView from "./CajaView.vue";
import api from "../api/axios";

vi.mock("../api/axios", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

let wrapper;

function mountView() {
  wrapper = mount(CajaView, {
    global: {
      stubs: {
        AppDialog: { template: "<div><slot /></div>" },
        CashCorrectionDialog: true,
      },
    },
  });
  return wrapper;
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => wrapper?.unmount());

describe("Cash register critical flow", () => {
  it("opens a closed cash register and refreshes the operational state", async () => {
    api.get
      .mockResolvedValueOnce({ data: { estado: "cerrada" } })
      .mockResolvedValueOnce({
        data: {
          estado: "abierta",
          monto_inicial: 75.5,
          ventas_efectivo: 0,
          ventas_digitales: 0,
          monto_esperado: 75.5,
          caja: { fecha_apertura: "2026-09-30T12:00:00Z" },
        },
      });
    api.post.mockResolvedValue({ data: { message: "Caja abierta" } });

    mountView();
    await flushPromises();
    expect(wrapper.text()).toContain("Caja cerrada");

    await wrapper.get("#opening-amount").setValue("75.50");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(api.post).toHaveBeenCalledWith("/caja/abrir", {
      monto_inicial: 75.5,
    });
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain("Caja abierta correctamente");
    expect(wrapper.text()).toContain("Turno activo");
  });

  it("confirms the counted amount, closes the shift and reports its difference", async () => {
    api.get
      .mockResolvedValueOnce({
        data: {
          estado: "abierta",
          monto_inicial: 100,
          ventas_efectivo: 20,
          ventas_digitales: 5,
          monto_esperado: 120,
          caja: { fecha_apertura: "2026-09-30T12:00:00Z" },
        },
      })
      .mockResolvedValueOnce({ data: { estado: "cerrada" } });
    api.post.mockResolvedValue({
      data: { resumen: { monto_esperado: 120, diferencia: -2 } },
    });

    mountView();
    await flushPromises();
    await wrapper.get("#closing-amount").setValue("118");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    const confirmButton = wrapper
      .findAll("button")
      .find((button) => button.text().includes("Confirmar cierre"));
    expect(confirmButton).toBeTruthy();
    await confirmButton.trigger("click");
    await flushPromises();

    expect(api.post).toHaveBeenCalledWith("/caja/cerrar", {
      monto_final: 118,
    });
    expect(wrapper.text()).toContain("Diferencia de arqueo: S/ -2.00");
    expect(wrapper.text()).toContain("Caja cerrada");
  });
});
