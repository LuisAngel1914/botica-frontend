import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import PosView from "./PosView.vue";
import ProductCatalog from "../components/pos/ProductCatalog.vue";
import SaleCart from "../components/pos/SaleCart.vue";
import PrescriptionDialog from "../components/pos/PrescriptionDialog.vue";
import api from "../api/axios";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("vue-router", () => ({ useRouter: () => ({ push }) }));
vi.mock("../api/axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
const product = {
  id: 1,
  nombre: "Producto de prueba",
  precio_venta: 4.5,
  stock_disponible: 3,
  condicion_venta: "libre",
  codigo_barras: "77501",
  lotes: [],
};
let wrapper;
function deferred() {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { resolve, promise };
}
async function start(products = [product]) {
  api.get.mockImplementation(async (url) => ({
    data:
      url === "/productos"
        ? products
        : url === "/caja/estado"
          ? { estado: "abierta" }
          : { id: 9, nombre: "Cliente de prueba" },
  }));
  wrapper = mount(PosView, {
    global: { stubs: { AppDialog: { template: "<div><slot /></div>" } } },
  });
  await flushPromises();
  return wrapper;
}
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});
afterEach(() => wrapper?.unmount());

describe("POS contract and interactions", () => {
  it("adds barcode matches, clamps integer quantities and never adds out-of-stock products", async () => {
    await start([
      product,
      { ...product, id: 2, nombre: "Agotado", stock_disponible: 0 },
    ]);
    await wrapper.get('input[aria-label="Buscar producto"]').setValue("77501");
    await wrapper.findComponent(ProductCatalog).get("form").trigger("submit");
    await flushPromises();
    const cart = wrapper.findComponent(SaleCart);
    expect(cart.props("cart")).toHaveLength(1);
    cart.vm.$emit("quantity", cart.props("cart")[0], 2.8);
    await flushPromises();
    expect(cart.props("cart")[0].cantidad).toBe(2);
    cart.vm.$emit("quantity", cart.props("cart")[0], 10);
    wrapper
      .findComponent(ProductCatalog)
      .vm.$emit("select", { ...product, id: 2, stock_disponible: 0 });
    await flushPromises();
    expect(cart.props("cart")).toHaveLength(1);
    expect(cart.props("cart")[0].cantidad).toBe(3);
  });
  it("preserves the sale payload and retry UUID after a network failure", async () => {
    await start();
    wrapper.findComponent(ProductCatalog).vm.$emit("select", product);
    await flushPromises();
    api.post
      .mockRejectedValueOnce(new Error("Network"))
      .mockResolvedValueOnce({ data: { idempotent: true } });
    const cart = wrapper.findComponent(SaleCart);
    cart.vm.$emit("checkout");
    await flushPromises();
    const first = api.post.mock.calls[0][1];
    expect(first).toMatchObject({
      cliente_id: null,
      metodo_pago: "Efectivo",
      receta: null,
      detalles: [{ producto_id: 1, cantidad: 1 }],
    });
    expect(first.idempotency_key).toMatch(/^[a-f\d-]{36}$/);
    cart.vm.$emit("checkout");
    await flushPromises();
    expect(api.post.mock.calls[1][1].idempotency_key).toBe(
      first.idempotency_key,
    );
    expect(cart.props("cart")).toHaveLength(0);
    expect(wrapper.text()).toContain("se recuperó la operación original");
  });
  it("locks the entire checkout attempt while cash status is pending", async () => {
    await start();
    wrapper.findComponent(ProductCatalog).vm.$emit("select", product);
    await flushPromises();
    const pending = deferred();
    api.get.mockImplementation((url) =>
      url === "/caja/estado"
        ? pending.promise
        : Promise.resolve({ data: [product] }),
    );
    api.post.mockResolvedValue({ data: {} });
    const cart = wrapper.findComponent(SaleCart);
    cart.vm.$emit("checkout");
    cart.vm.$emit("checkout");
    cart.vm.$emit("quantity", cart.props("cart")[0], 3);
    wrapper.findComponent(ProductCatalog).vm.$emit("select", product);
    await flushPromises();
    expect(cart.props("processing")).toBe(true);
    expect(cart.props("cart")[0].cantidad).toBe(1);
    pending.resolve({ data: { estado: "abierta" } });
    await flushPromises();
    expect(api.post).toHaveBeenCalledTimes(1);
  });
  it("routes to caja without selling when cash is closed", async () => {
    await start();
    wrapper.findComponent(ProductCatalog).vm.$emit("select", product);
    await flushPromises();
    api.get.mockResolvedValue({ data: { estado: "cerrada" } });
    wrapper.findComponent(SaleCart).vm.$emit("checkout");
    await flushPromises();
    expect(api.post).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith({ name: "caja" });
  });
  it("requires verified prescription and identified patient before submitting a prescription sale", async () => {
    const rxProduct = { ...product, condicion_venta: "con_receta" };
    await start([rxProduct]);
    wrapper.findComponent(ProductCatalog).vm.$emit("select", rxProduct);
    await flushPromises();
    const dialog = wrapper.findComponent(PrescriptionDialog);
    expect(dialog.props("open")).toBe(true);
    dialog.vm.$emit("confirm");
    await flushPromises();
    expect(wrapper.findComponent(SaleCart).props("cart")).toHaveLength(0);
    const rx = {
      prescriptor_nombre: "Prescriptor de prueba",
      prescriptor_colegiatura: "QA123",
      fecha_emision: "2026-01-01",
      tipo: "fisica",
      referencia: "",
      verificada: true,
    };
    dialog.vm.$emit("update:data", rx);
    await flushPromises();
    dialog.vm.$emit("confirm");
    await flushPromises();
    const cart = wrapper.findComponent(SaleCart);
    cart.vm.$emit("checkout");
    await flushPromises();
    expect(api.post).not.toHaveBeenCalled();
    cart.vm.$emit("update:document-number", "00000000");
    await flushPromises();
    cart.vm.$emit("find-customer");
    await flushPromises();
    api.post.mockResolvedValue({ data: {} });
    cart.vm.$emit("checkout");
    await flushPromises();
    expect(api.post.mock.calls[0][1]).toMatchObject({
      cliente_id: 9,
      receta: rx,
    });
  });
  it("discards a stale customer response after the document changes", async () => {
    await start();
    const pending = deferred();
    api.get.mockReturnValue(pending.promise);
    const cart = wrapper.findComponent(SaleCart);
    cart.vm.$emit("update:document-number", "11111111");
    await flushPromises();
    cart.vm.$emit("find-customer");
    cart.vm.$emit("update:document-number", "22222222");
    await flushPromises();
    pending.resolve({ data: { id: 9 } });
    await flushPromises();
    expect(cart.props("customer")).toBeNull();
  });
  it("exposes catalog errors with a retry action", async () => {
    api.get.mockRejectedValue(new Error("offline"));
    wrapper = mount(PosView, { global: { stubs: { AppDialog: true } } });
    await flushPromises();
    expect(wrapper.text()).toContain("No pudimos cargar el catálogo");
    api.get.mockResolvedValue({ data: [product] });
    await wrapper
      .findAll("button")
      .find((b) => b.text() === "Reintentar")
      .trigger("click");
    await flushPromises();
    expect(wrapper.text()).toContain("Producto de prueba");
  });
});
