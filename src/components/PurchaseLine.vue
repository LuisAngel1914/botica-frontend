<template>
  <fieldset class="rounded-xl border bg-slate-50/70 p-4">
    <legend class="px-1 text-xs font-semibold text-slate-600">
      Producto {{ index + 1 }}
    </legend>
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <label class="xl:col-span-2"
        ><span class="field-label">Producto</span
        ><select
          :value="modelValue.producto_id"
          class="field-control"
          required
          @change="update('producto_id', Number($event.target.value))"
        >
          <option value="" disabled>Selecciona un producto</option>
          <option
            v-for="product in products"
            :key="product.id"
            :value="product.id"
          >
            {{ product.nombre }}
          </option>
        </select></label
      >
      <label
        ><span class="field-label">Lote</span
        ><input
          :value="modelValue.numero_lote"
          class="field-control"
          required
          @input="update('numero_lote', $event.target.value.trim())"
      /></label>
      <label
        ><span class="field-label">Cantidad</span
        ><input
          :value="modelValue.cantidad"
          class="field-control"
          type="number"
          min="1"
          step="1"
          required
          @input="update('cantidad', Number($event.target.value))"
      /></label>
      <label
        ><span class="field-label">Costo unitario · S/</span
        ><input
          :value="modelValue.costo_unitario"
          class="field-control"
          type="number"
          min="0"
          step="0.01"
          required
          @input="update('costo_unitario', Number($event.target.value))"
      /></label>
      <label class="sm:max-w-xs"
        ><span class="field-label">Vencimiento</span
        ><input
          :value="modelValue.fecha_vencimiento"
          class="field-control"
          type="date"
          required
          @input="update('fecha_vencimiento', $event.target.value)"
      /></label>
    </div>
    <div class="mt-3 flex items-center justify-between border-t pt-3">
      <button
        v-if="removable"
        class="btn !min-h-9 !px-2 !py-1 !text-xs text-red-700 hover:bg-red-50"
        type="button"
        :aria-label="'Quitar producto ' + (index + 1)"
        @click="$emit('remove')"
      >
        Quitar producto
      </button>
      <p class="ml-auto text-xs text-slate-500">
        Subtotal
        <strong class="ml-3 text-sm text-slate-900"
          >S/
          {{ money(modelValue.cantidad * modelValue.costo_unitario) }}</strong
        >
      </p>
    </div>
  </fieldset>
</template>
<script setup>
import { money } from "../utils/productPresentation";
const props = defineProps({
  modelValue: { type: Object, required: true },
  index: Number,
  products: Array,
  removable: Boolean,
});
const emit = defineEmits(["update:modelValue", "remove"]);
function update(key, value) {
  emit("update:modelValue", { ...props.modelValue, [key]: value });
}
</script>
