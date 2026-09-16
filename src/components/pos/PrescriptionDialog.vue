<template>
  <AppDialog :open="open" label="Validar receta médica" @close="$emit('close')">
    <form
      class="w-[440px] max-w-full bg-white p-6"
      @submit.prevent="$emit('confirm')"
    >
      <span
        class="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-800"
        ><FileText :size="22"
      /></span>
      <p class="section-kicker">Dispensación responsable</p>
      <h2 class="mt-1 text-xl font-semibold">Validar receta médica</h2>
      <p class="mt-2 text-sm text-slate-500">
        {{ product?.nombre }} requiere prescripción.
      </p>
      <div class="mt-6 space-y-4">
        <label class="block"
          ><span class="field-label">Nombre del prescriptor</span
          ><input
            :value="data.prescriptor_nombre"
            class="field-control"
            required
            autocomplete="off"
            @input="update('prescriptor_nombre', $event.target.value)" /></label
        ><label class="block"
          ><span class="field-label">Colegiatura</span
          ><input
            :value="data.prescriptor_colegiatura"
            class="field-control"
            required
            @input="
              update('prescriptor_colegiatura', $event.target.value)
            " /></label
        ><label class="block"
          ><span class="field-label">Fecha de emisión</span
          ><input
            :value="data.fecha_emision"
            class="field-control"
            type="date"
            :max="today"
            required
            @input="update('fecha_emision', $event.target.value)" /></label
        ><label
          class="flex items-start gap-3 rounded-lg border bg-slate-50 p-3 text-xs leading-5"
          ><input
            class="mt-1 accent-teal-700"
            :checked="data.verificada"
            type="checkbox"
            required
            @change="update('verificada', $event.target.checked)"
          />Confirmo que revisé y verifiqué la receta médica.</label
        >
      </div>
      <div class="mt-6 flex justify-end gap-2">
        <button class="btn btn-secondary" type="button" @click="$emit('close')">
          Cancelar</button
        ><button class="btn btn-primary" type="submit">Agregar a venta</button>
      </div>
    </form>
  </AppDialog>
</template>
<script setup>
import { FileText } from "lucide-vue-next";
import AppDialog from "../ui/AppDialog.vue";
const props = defineProps({
  open: Boolean,
  product: Object,
  data: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["close", "confirm", "update:data"]);
const date = new Date();
const today = [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, "0"),
  String(date.getDate()).padStart(2, "0"),
].join("-");
function update(key, value) {
  emit("update:data", { ...props.data, [key]: value });
}
</script>
