<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="app-dialog"
      :aria-label="label"
      :aria-busy="busy"
      @cancel="cancel"
      @click="onBackdrop"
      @click.capture="blockWhileBusy"
      @submit.capture="blockWhileBusy"
    >
      <p v-if="error" class="dialog-error" role="alert">{{ error }}</p>
      <slot />
    </dialog>
  </Teleport>
</template>

<script setup>
import { onBeforeUnmount, ref, watch, nextTick } from "vue";

const props = defineProps({
  open: Boolean,
  label: { type: String, required: true },
  busy: Boolean,
  error: String,
});
const emit = defineEmits(["close"]);
const dialog = ref(null);
let trigger;
let previousOverflow;
function restore() {
  if (previousOverflow !== undefined)
    document.body.style.overflow = previousOverflow;
  previousOverflow = undefined;
  if (trigger?.isConnected) trigger.focus();
}
watch(
  () => props.open,
  async (open) => {
    await nextTick();
    if (!dialog.value) return;
    if (open && !dialog.value.open) {
      trigger = document.activeElement;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      dialog.value.showModal();
    } else if (!open && dialog.value.open) {
      dialog.value.close();
      restore();
    }
  },
  { immediate: true },
);
function cancel(event) {
  event.preventDefault();
  if (!props.busy) emit("close");
}
function blockWhileBusy(event) {
  if (props.busy) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}
function onBackdrop(event) {
  if (event.target !== dialog.value) return;
  const bounds = dialog.value.getBoundingClientRect();
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  )
    cancel(event);
}
onBeforeUnmount(() => {
  dialog.value?.close();
  restore();
});
</script>
