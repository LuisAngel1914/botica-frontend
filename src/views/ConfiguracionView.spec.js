import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import ConfiguracionView from "./ConfiguracionView.vue";

const api = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }));
vi.mock("../api/axios", () => ({ default: api }));

const settings = {
  nombre_comercial: "Botica L y L",
  razon_social: "Botica L y L S.A.C.",
  ruc: "20123456789",
  direccion: "Av. Principal 123",
  telefono: "999888777",
  email: "contacto@botica.test",
  logo_url: "",
  moneda: "PEN",
  simbolo_moneda: "S/",
  regimen_tributario: "NRUS",
  modo_emision_comprobantes: "demo",
  tipo_comprobante_predeterminado: "boleta",
  impuesto_nombre: "IGV",
  impuesto_porcentaje: 18,
  serie_comprobante: "B001",
  stock_minimo_default: 5,
  dias_alerta_vencimiento: 60,
  mensaje_ticket: "Gracias por su preferencia.",
};

const stubs = {
  PageHeader: { template: "<header><slot name='actions' /></header>" },
  InlineNotice: { props: ["notice"], template: "<p v-if='notice'>{{ notice.message }}</p>" },
};

describe("ConfiguracionView", () => {
  afterEach(() => vi.clearAllMocks());

  it("loads and saves the installation settings", async () => {
    api.get.mockResolvedValue({ data: settings });
    api.put.mockResolvedValue({ data: { message: "Configuración guardada correctamente.", configuracion: { ...settings, nombre_comercial: "Farmacia Central" } } });

    const wrapper = mount(ConfiguracionView, { global: { stubs } });
    await flushPromises();

    const nameInput = wrapper.findAll("input")[0];
    expect(nameInput.element.value).toBe("Botica L y L");
    await nameInput.setValue("Farmacia Central");
    await wrapper.get("#business-settings").trigger("submit");
    await flushPromises();

    expect(api.put).toHaveBeenCalledWith("/configuracion", expect.objectContaining({ nombre_comercial: "Farmacia Central", ruc: "20123456789" }));
    expect(wrapper.text()).toContain("Configuración guardada correctamente.");
  });
});
