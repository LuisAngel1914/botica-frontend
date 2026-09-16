import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import AppShell from "./AppShell.vue";
import router from "../router";
import { useAuth } from "../composables/useAuth";

vi.mock("../api/axios", () => ({
  default: { post: vi.fn().mockResolvedValue({}) },
}));
let wrapper;
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function () {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function () {
    this.open = false;
  });
});
afterEach(() => {
  wrapper?.unmount();
  useAuth().clearSession();
  document.body.innerHTML = "";
});
it("keeps administrative routes out of cashier navigation and rejects direct access", async () => {
  useAuth().setSession({
    token: "test",
    user: { name: "Cajero", role: "cajero" },
  });
  await router.push("/inventario");
  expect(router.currentRoute.value.name).toBe("pos");
  wrapper = mount(AppShell, {
    global: { plugins: [router], stubs: { ChatIaModal: true } },
  });
  const hrefs = wrapper.findAll("nav a").map((link) => link.attributes("href"));
  expect(hrefs).toContain("/pos");
  expect(hrefs).toContain("/caja");
  expect(hrefs).not.toContain("/inventario");
  expect(hrefs).not.toContain("/usuarios");
});
it("exposes all admin modules and logout through the mobile menu", async () => {
  useAuth().setSession({
    token: "test",
    user: { name: "Admin", role: "admin" },
  });
  await router.push("/pos");
  wrapper = mount(AppShell, {
    attachTo: document.body,
    global: { plugins: [router], stubs: { ChatIaModal: true } },
  });
  await wrapper.get('button[aria-label="Abrir navegación"]').trigger("click");
  await flushPromises();
  const dialog = document.querySelector("dialog[open]");
  expect(dialog).not.toBeNull();
  const hrefs = [...dialog.querySelectorAll("nav a")].map((link) =>
    link.getAttribute("href"),
  );
  expect(hrefs).toEqual(
    expect.arrayContaining([
      "/dashboard",
      "/pos",
      "/caja",
      "/ventas",
      "/compras",
      "/clientes",
      "/inventario",
      "/actividad",
      "/usuarios",
    ]),
  );
  expect(dialog.textContent).toContain("Cerrar sesión");
});
