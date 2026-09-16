<template>
  <AppDialog
    :open="open && Boolean(product)"
    label="Ficha de producto"
    @close="$emit('close')"
  >
    <section v-if="product" class="w-[480px] max-w-full bg-white">
      <header class="flex items-center justify-between border-b px-5 py-3">
        <p class="section-kicker">Ficha de catálogo</p>
        <button
          class="icon-button"
          aria-label="Cerrar ficha"
          @click="$emit('close')"
        >
          <X :size="18" />
        </button>
      </header>
      <ProductImage
        class="h-48"
        :src="product.imagen_url"
        :name="product.nombre"
      />
      <div class="p-5">
        <div class="flex flex-wrap gap-2">
          <AppBadge :tone="sellableStock(product) > 0 ? 'success' : 'danger'"
            >{{ sellableStock(product) }} unidades disponibles</AppBadge
          ><AppBadge v-if="requiresPrescription(product)" tone="warning"
            >Venta bajo receta</AppBadge
          >
        </div>
        <h2 class="mt-4 text-xl font-semibold tracking-tight">
          {{ product.nombre }}
        </h2>
        <p class="mt-2 text-sm text-slate-500">
          {{ product.principio_activo || "Principio activo no especificado" }}
        </p>
        <dl class="my-5 divide-y divide-slate-100 text-xs">
          <div
            v-for="[label, value] in details"
            :key="label"
            class="flex justify-between gap-5 py-3"
          >
            <dt class="text-slate-500">{{ label }}</dt>
            <dd class="text-right font-medium">{{ value }}</dd>
          </div>
        </dl>
        <div class="flex items-center justify-between border-t pt-4">
          <strong class="text-2xl font-semibold"
            >S/ {{ money(product.precio_venta) }}</strong
          ><button
            class="btn btn-primary"
            :disabled="disabled || sellableStock(product) <= 0"
            @click="$emit('select', product)"
          >
            <Plus :size="17" />Agregar a venta
          </button>
        </div>
      </div>
    </section>
  </AppDialog>
</template>
<script setup>
import { computed } from "vue";
import { Plus, X } from "lucide-vue-next";
import AppDialog from "../ui/AppDialog.vue";
import AppBadge from "../ui/AppBadge.vue";
import ProductImage from "../ui/ProductImage.vue";
import {
  expiryInfo,
  money,
  requiresPrescription,
  sellableStock,
} from "../../utils/productPresentation";
const props = defineProps({
  open: Boolean,
  product: Object,
  disabled: Boolean,
});
defineEmits(["close", "select"]);
const details = computed(() => [
  ["Presentación", props.product?.presentacion || "No especificada"],
  ["Categoría", props.product?.categoria || "General"],
  ["Código", props.product?.codigo_barras || "Sin código"],
  [
    "Próximo lote vigente",
    props.product ? expiryInfo(props.product).label : "—",
  ],
]);
</script>
