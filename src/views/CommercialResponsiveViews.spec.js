import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import api from "../api/axios";
import InventarioView from "./InventarioView.vue";
import ClientesView from "./ClientesView.vue";
import ComprasView from "./ComprasView.vue";
import ActividadView from "./ActividadView.vue";

vi.mock("../api/axios", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));
vi.mock("vue-router", () => ({
  useRoute: () => ({ query: {} }),
}));

const product = {
  id: 1,
  nombre: "Producto adaptable",
  presentacion: "Caja",
  codigo_barras: "123456",
  stock_actual: 12,
  stock_minimo: 5,
  precio_venta: 8.5,
  lotes: [
    {
      id: 10,
      numero_lote: "MOVIL-01",
      stock: 12,
      fecha_vencimiento: "2027-12-31",
    },
  ],
};

const customer = {
  id: 2,
  tipo_documento: "DNI",
  numero_documento: "00000000",
  nombre_razon_social: "Cliente adaptable",
  telefono: "999999999",
  email: "cliente@example.test",
  direccion: "Dirección de prueba",
  compras_completadas: 2,
  gasto_total: 25,
};

const receipt = {
  id: 3,
  fecha_recepcion: "2026-10-01T12:00:00Z",
  total: 15,
  proveedor: { nombre: "Proveedor de prueba" },
  user: { name: "Administrador" },
  detalles: [
    {
      id: 4,
      cantidad: 3,
      costo_unitario: 5,
      numero_lote: "COMPRA-01",
      producto: { nombre: "Producto adaptable" },
    },
  ],
};

const wrappers = [];

function remember(wrapper) {
  wrappers.push(wrapper);
  return wrapper;
}

function mountView(component) {
  return remember(
    mount(component, {
      global: {
        stubs: {
          AppDialog: { template: "<div><slot /></div>" },
        },
      },
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockImplementation((url) => {
    if (url === "/inventario") return Promise.resolve({ data: { data: [product] } });
    if (url === "/inventario/por-vencer") return Promise.resolve({ data: [] });
    if (url === "/inventario/movimientos") {
      return Promise.resolve({
        data: {
          data: [
            {
              id: 5,
              cantidad: 1,
              tipo: "entrada_lote",
              created_at: "2026-10-01T12:00:00Z",
              producto: { nombre: product.nombre },
              lote: { numero_lote: "MOVIL-01" },
              user: { name: "Administrador" },
            },
          ],
          current_page: 1,
          last_page: 2,
        },
      });
    }
    if (url === "/usuarios") return Promise.resolve({ data: { data: [] } });
    if (url === "/clientes") {
      return Promise.resolve({
        data: { data: [customer], current_page: 1, last_page: 2, total: 1 },
      });
    }
    if (url === "/proveedores") {
      return Promise.resolve({ data: { data: [{ id: 1, nombre: "Proveedor de prueba" }] } });
    }
    if (url === "/productos") return Promise.resolve({ data: { data: [product] } });
    if (url === "/compras") return Promise.resolve({ data: { data: [receipt] } });
    if (url === "/actividad") {
      return Promise.resolve({
        data: {
          data: [
            {
              id: 6,
              action: "sale.created",
              created_at: "2026-10-01T12:00:00Z",
              user: { name: "Administrador" },
              metadata: { total: 10 },
            },
          ],
          current_page: 1,
          last_page: 2,
        },
      });
    }
    return Promise.resolve({ data: {} });
  });
});

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
});

describe("commercial views responsive presentation", () => {
  it("renders inventory cards on mobile and preserves its desktop table", async () => {
    const wrapper = mountView(InventarioView);
    await flushPromises();

    expect(wrapper.get('[data-testid="mobile-inventory-list"]').text()).toContain(
      "Producto adaptable",
    );
    expect(wrapper.get('[data-testid="mobile-inventory-list"]').classes()).toContain(
      "md:hidden",
    );
    expect(wrapper.get('[data-testid="desktop-inventory-table"]').classes()).toContain(
      "md:block",
    );
    expect(wrapper.get('[data-testid="inventory-movement"]').classes()).toContain(
      "flex-wrap",
    );
    expect(wrapper.get('[data-testid="inventory-pagination"]').classes()).toContain(
      "flex-col",
    );
  });

  it("renders complete customer cards on mobile and preserves its desktop table", async () => {
    const wrapper = mountView(ClientesView);
    await flushPromises();

    const mobileList = wrapper.get('[data-testid="mobile-customers-list"]');
    expect(mobileList.text()).toContain("Cliente adaptable");
    expect(mobileList.text()).toContain("S/ 25.00");
    expect(mobileList.classes()).toContain("md:hidden");
    expect(wrapper.get('[data-testid="desktop-customers-table"]').classes()).toContain(
      "md:block",
    );
    expect(wrapper.get('[data-testid="customers-pagination"]').classes()).toContain(
      "flex-col",
    );
  });

  it("uses mobile cards for purchase details", async () => {
    const wrapper = mountView(ComprasView);
    await flushPromises();

    await wrapper
      .findAll("button")
      .find((button) => button.text() === "Ver detalle")
      .trigger("click");

    expect(wrapper.get('[data-testid="mobile-purchase-detail"]').text()).toContain(
      "Producto adaptable",
    );
    expect(wrapper.get('[data-testid="mobile-purchase-detail"]').classes()).toContain(
      "sm:hidden",
    );
    expect(wrapper.get('[data-testid="desktop-purchase-detail"]').classes()).toContain(
      "sm:block",
    );
  });

  it("stacks activity pagination on narrow screens", async () => {
    const wrapper = mountView(ActividadView);
    await flushPromises();

    expect(wrapper.get('[data-testid="activity-pagination"]').classes()).toContain(
      "flex-col",
    );
  });
});
