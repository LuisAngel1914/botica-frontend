import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import UsuariosView from "./UsuariosView.vue";
import { useAuth } from "../composables/useAuth";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }));

vi.mock("../api/axios", () => ({ default: api }));

const stubs = {
  PageHeader: { template: "<header><slot name='actions' /></header>" },
  InlineNotice: {
    props: ["notice"],
    template: "<p v-if='notice'>{{ notice.message }}</p>",
  },
  DataTable: { template: "<table><slot /></table>" },
  SkeletonLoader: true,
  EmptyState: true,
  AppDialog: {
    props: ["error"],
    emits: ["close"],
    template: "<section><p v-if='error' role='alert'>{{ error }}</p><slot /></section>",
  },
};

describe("UsuariosView password reset", () => {
  beforeEach(() => {
    useAuth().setSession({
      token: "admin-token",
      user: { id: 1, name: "Administrador", role: "admin" },
    });
    api.get.mockImplementation((url) => {
      if (url === "/usuarios") {
        return Promise.resolve({
          data: [
            { id: 1, name: "Administrador", email: "admin@botica.com", role: "admin", activo: true },
            { id: 2, name: "Luis", email: "luis@botica.com", role: "cajero", activo: true },
          ],
        });
      }
      return Promise.resolve({ data: { desde: "2026-09-01", usuarios: [] } });
    });
    api.patch.mockResolvedValue({
      data: { message: "Contraseña restablecida. Las sesiones anteriores del usuario fueron cerradas." },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    useAuth().clearSession();
  });

  it("lets an admin reset another user's password with confirmation", async () => {
    const wrapper = mount(UsuariosView, { global: { stubs } });
    await flushPromises();

    const resetButtons = wrapper
      .findAll("button")
      .filter((button) => button.text().includes("Restablecer contraseña"));
    expect(resetButtons).toHaveLength(1);
    await resetButtons[0].trigger("click");

    await wrapper.get("#reset-password").setValue("NuevaClaveSegura2026");
    await wrapper
      .get("#reset-password-confirmation")
      .setValue("NuevaClaveSegura2026");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(api.patch).toHaveBeenCalledWith("/usuarios/2/password", {
      password: "NuevaClaveSegura2026",
      password_confirmation: "NuevaClaveSegura2026",
    });
    expect(wrapper.text()).toContain("Contraseña restablecida");
  });

  it("blocks mismatched passwords before sending them", async () => {
    const wrapper = mount(UsuariosView, { global: { stubs } });
    await flushPromises();
    const resetButton = wrapper
      .findAll("button")
      .find((button) => button.text().includes("Restablecer contraseña"));
    await resetButton.trigger("click");
    await wrapper.get("#reset-password").setValue("NuevaClaveSegura2026");
    await wrapper.get("#reset-password-confirmation").setValue("NoCoincide2026");
    await wrapper.get("form").trigger("submit");

    expect(api.patch).not.toHaveBeenCalled();
    expect(wrapper.get("[role='alert']").text()).toBe("Las contraseñas no coinciden.");
  });
});
