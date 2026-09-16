import { afterEach, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import AppDialog from "./AppDialog.vue";
let wrapper;
afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = "";
  document.body.style.overflow = "";
});
it("opens a native modal, protects busy work and restores the opener when closed", async () => {
  HTMLDialogElement.prototype.showModal = vi.fn(function () {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function () {
    this.open = false;
  });
  const opener = document.createElement("button");
  document.body.append(opener);
  opener.focus();
  wrapper = mount(AppDialog, {
    props: { open: true, label: "Dialog test", busy: true },
    slots: { default: "<button>Close</button>" },
    attachTo: document.body,
  });
  await flushPromises();
  const dialog = document.querySelector("dialog");
  expect(dialog.open).toBe(true);
  expect(document.body.style.overflow).toBe("hidden");
  dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
  expect(wrapper.emitted("close")).toBeUndefined();
  await wrapper.setProps({ busy: false });
  dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
  expect(wrapper.emitted("close")).toHaveLength(1);
  await wrapper.setProps({ open: false });
  await flushPromises();
  expect(document.activeElement).toBe(opener);
  expect(document.body.style.overflow).toBe("");
});
