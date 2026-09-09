<template>
  <section class="app-card flex min-h-0 flex-col overflow-hidden">
    <header class="border-b border-slate-100 p-4 sm:p-5">
      <div class="mb-4 flex items-start justify-between gap-4"><div><p class="text-xs font-semibold uppercase tracking-wider text-cyan-700">Catálogo</p><h2 class="mt-1 text-lg font-bold text-slate-900">Productos disponibles</h2></div><span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{{ products.length }} resultados</span></div>
      <form class="flex gap-2" @submit.prevent="$emit('search')"><div class="relative min-w-0 flex-1"><Search class="pointer-events-none absolute left-3 top-3 text-slate-400" :size="18" /><input :value="query" class="field-control pl-10" placeholder="Nombre o código de barras…" aria-label="Buscar producto" @input="$emit('update:query', $event.target.value)" /></div><button class="btn btn-primary px-3 sm:px-4" type="submit"><Search :size="18" /><span class="hidden sm:inline">Buscar</span></button></form>
    </header>
    <div v-if="loading" class="grid flex-1 place-items-center p-10 text-sm text-slate-500"><LoaderCircle class="mb-2 animate-spin text-cyan-700" :size="24" />Cargando productos…</div>
    <div v-else-if="products.length" class="grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto p-4 sm:grid-cols-3 xl:grid-cols-4">
      <button v-for="product in products" :key="product.id" class="group relative min-h-36 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-xs transition hover:-translate-y-0.5 hover:border-cyan-500 hover:shadow-md focus-visible:outline-cyan-600 disabled:cursor-not-allowed disabled:opacity-50" :disabled="Number(product.stock_actual) <= 0" @click="$emit('select', product)">
        <div class="mb-5 flex items-start justify-between gap-2"><span v-if="product.requiere_receta" class="rounded-md bg-red-50 px-1.5 py-1 text-[10px] font-bold text-red-700">Con receta</span><span v-if="expiryAlert(product)" class="ml-auto rounded-md px-1.5 py-1 text-[10px] font-bold" :class="expiryAlert(product).class">{{ expiryAlert(product).label }}</span></div>
        <p class="line-clamp-2 text-sm font-bold leading-5 text-slate-800">{{ product.nombre }}</p><p class="mt-1 line-clamp-1 text-xs text-slate-500">{{ product.presentacion || 'Unidad' }}</p>
        <div class="mt-3 flex items-end justify-between gap-2"><span class="text-xs font-semibold" :class="Number(product.stock_actual) > 5 ? 'text-emerald-700' : 'text-amber-700'">Stock: {{ product.stock_actual }}</span><span class="text-base font-black text-cyan-700">S/ {{ money(product.precio_venta) }}</span></div>
      </button>
    </div>
    <div v-else class="grid flex-1 place-items-center p-10 text-center"><PackageSearch class="mb-3 text-slate-300" :size="32" /><div><p class="font-semibold text-slate-700">No hay coincidencias</p><p class="mt-1 text-sm text-slate-500">Prueba con otro nombre o código de barras.</p></div></div>
  </section>
</template>
<script setup>
import { LoaderCircle, PackageSearch, Search } from 'lucide-vue-next';
defineProps({ products: { type: Array, default: () => [] }, loading: Boolean, query: { type: String, default: '' } });
defineEmits(['update:query', 'search', 'select']);
const money = (value) => Number(value || 0).toFixed(2);
function expiryAlert(product) { const date = product.lotes?.[0]?.fecha_vencimiento; if (!date) return null; const days = Math.ceil((new Date(date) - new Date()) / 86400000); if (days <= 15) return { label: 'Vence pronto', class: 'bg-red-50 text-red-700' }; if (days <= 60) return { label: 'Vence < 60d', class: 'bg-amber-50 text-amber-700' }; return null; }
</script>
