<template>
  <div v-if="open && product" class="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-0 sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="product-detail-title" @click.self="$emit('close')">
    <section class="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl">
      <div class="relative aspect-[16/8] overflow-hidden bg-gradient-to-br from-cyan-100 via-white to-blue-50">
        <img v-if="product.imagen_url && !imageBroken" :src="product.imagen_url" :alt="product.nombre" class="h-full w-full object-cover" @error="imageBroken = true" />
        <div v-else class="grid h-full place-items-center text-cyan-700"><Package :size="52" stroke-width="1.4" /></div>
        <button class="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-700 shadow-sm hover:bg-white" aria-label="Cerrar ficha" @click="$emit('close')"><X :size="18" /></button>
      </div>

      <div class="p-5 sm:p-6">
        <div class="flex flex-wrap items-center gap-2"><span v-if="product.requiere_receta" class="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">Venta bajo receta</span><span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="stockClass">{{ stockLabel }}</span></div>
        <h2 id="product-detail-title" class="mt-3 text-2xl font-black tracking-tight text-slate-900">{{ product.nombre }}</h2>
        <p v-if="product.principio_activo" class="mt-1 text-sm text-slate-600">Principio activo: <strong>{{ product.principio_activo }}</strong></p>

        <dl class="mt-5 grid grid-cols-2 gap-3">
          <div class="rounded-xl bg-slate-50 p-3"><dt class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Presentación</dt><dd class="mt-1 text-sm font-bold text-slate-800">{{ product.presentacion || 'No especificada' }}</dd></div>
          <div class="rounded-xl bg-slate-50 p-3"><dt class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Categoría</dt><dd class="mt-1 text-sm font-bold text-slate-800">{{ product.categoria || 'General' }}</dd></div>
          <div class="rounded-xl bg-slate-50 p-3"><dt class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Disponible</dt><dd class="mt-1 text-sm font-bold text-slate-800">{{ product.stock_actual }} unidades</dd></div>
          <div class="rounded-xl bg-slate-50 p-3"><dt class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Vencimiento próximo</dt><dd class="mt-1 text-sm font-bold text-slate-800">{{ expiryDate }}</dd></div>
        </dl>

        <div class="mt-5 flex items-end justify-between border-t border-slate-100 pt-5"><div><p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Precio de venta</p><p class="mt-1 text-2xl font-black text-cyan-700">S/ {{ money(product.precio_venta) }}</p></div><button class="btn btn-primary" :disabled="Number(product.stock_actual) <= 0" @click="$emit('select', product)"><ShoppingCart :size="18" />Agregar</button></div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { Package, ShoppingCart, X } from 'lucide-vue-next';

const props = defineProps({ open: Boolean, product: { type: Object, default: null } });
defineEmits(['close', 'select']);
const imageBroken = ref(false);
watch(() => props.product?.id, () => { imageBroken.value = false; });

const money = (value) => Number(value || 0).toFixed(2);
const stockClass = computed(() => Number(props.product?.stock_actual) > 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800');
const stockLabel = computed(() => Number(props.product?.stock_actual) > 0 ? 'Disponible' : 'Sin stock');
const expiryDate = computed(() => {
  const date = props.product?.lotes?.[0]?.fecha_vencimiento;
  return date ? new Date(date + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin lote activo';
});
</script>