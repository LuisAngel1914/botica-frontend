<template>
  <section class="app-card flex min-h-0 flex-col overflow-hidden">
    <header class="border-b border-slate-100 bg-gradient-to-br from-white via-white to-cyan-50/70 p-4 sm:p-6">
      <div class="mb-5 flex items-start justify-between gap-4"><div><p class="section-kicker">Catálogo inteligente</p><h2 class="mt-1 text-xl font-black tracking-tight text-slate-950">Encuentra y agrega productos</h2><p class="mt-1 text-xs text-slate-500">Nombre, principio activo o lectura de código.</p></div><span class="rounded-full border border-cyan-100 bg-white px-3 py-1.5 text-xs font-bold text-cyan-800 shadow-sm">{{ products.length }} disponibles</span></div>
      <form class="flex gap-2" @submit.prevent="$emit('search')"><div class="relative min-w-0 flex-1"><Search class="pointer-events-none absolute left-4 top-3.5 text-cyan-700" :size="18" /><input :value="query" class="field-control !rounded-2xl !py-3 pl-11 shadow-sm" placeholder="Buscar medicamento o escanear código…" aria-label="Buscar producto" @input="$emit('update:query', $event.target.value)" /></div><button class="btn btn-primary !rounded-2xl px-3 sm:px-5" type="submit"><Search :size="18" /><span class="hidden sm:inline">Buscar</span></button></form>
    </header>

    <div v-if="!query && quickProducts.length" class="border-b border-slate-100 bg-slate-50/80 p-4 sm:px-6">
      <div class="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><Heart :size="14" class="text-rose-500" />Tu acceso rápido</div>
      <div class="flex gap-2 overflow-x-auto pb-1">
        <div v-for="product in quickProducts" :key="product.id" class="flex shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300">
          <button class="max-w-40 px-3.5 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-cyan-50" @click="$emit('select', product)"><span class="block truncate">{{ product.nombre }}</span><span class="mt-1 block text-cyan-700">S/ {{ money(product.precio_venta) }}</span></button>
          <button class="border-l border-slate-100 px-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" :aria-label="'Alternar favorito: ' + product.nombre" @click="$emit('toggle-favorite', product)"><Heart :size="15" :fill="favoriteIds.includes(product.id) ? 'currentColor' : 'none'" :class="favoriteIds.includes(product.id) ? 'text-rose-500' : ''" /></button>
        </div>
      </div>
    </div>
    <div v-if="loading" class="grid flex-1 place-items-center p-10 text-sm text-slate-500"><LoaderCircle class="mb-2 animate-spin text-cyan-700" :size="24" />Cargando productos…</div>
    <div v-else-if="products.length" class="grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto p-4 sm:grid-cols-3 sm:p-5 xl:grid-cols-3">
      <article v-for="product in products" :key="product.id" class="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-cyan-400 hover:shadow-lg">
        <button class="block w-full text-left focus-visible:outline-cyan-600 disabled:cursor-not-allowed disabled:opacity-50" :disabled="Number(product.stock_disponible || 0) <= 0" @click="$emit('select', product)">
          <div class="relative aspect-square overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-slate-100"><img v-if="product.imagen_url && !brokenImageIds.has(product.id)" :src="product.imagen_url" :alt="product.nombre" class="h-full w-full object-contain p-4 transition duration-500 group-hover:scale-110" loading="lazy" @error="hideBrokenImage(product.id)" /><div v-else class="grid h-full place-items-center bg-gradient-to-br from-cyan-100 to-blue-50 text-cyan-700"><Package :size="38" stroke-width="1.5" /></div><div class="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3"><span v-if="product.requiere_receta" class="rounded-lg bg-red-600 px-2 py-1 text-[10px] font-bold text-white shadow-sm">Receta</span><span v-if="expiryAlert(product)" class="ml-auto rounded-lg px-2 py-1 text-[10px] font-bold shadow-sm" :class="expiryAlert(product).class">{{ expiryAlert(product).label }}</span></div><span class="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-lg font-light text-white opacity-0 shadow-lg transition group-hover:opacity-100">+</span></div>
          <div class="p-3.5"><p class="line-clamp-2 text-sm font-black leading-5 text-slate-900">{{ product.nombre }}</p><p class="mt-1 line-clamp-1 text-xs text-slate-500">{{ product.presentacion || 'Unidad' }}</p><div class="mt-4 flex items-end justify-between gap-2"><span class="rounded-md px-1.5 py-1 text-[10px] font-bold" :class="Number(product.stock_disponible || 0) > 5 ? 'bg-emerald-50 text-emerald-700' : Number(product.stock_disponible || 0) > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'">{{ product.stock_disponible || 0 }} un.</span><span class="text-lg font-black tracking-tight text-cyan-700">S/ {{ money(product.precio_venta) }}</span></div></div>
        </button>
        <button class="absolute bottom-14 left-3.5 grid h-8 w-8 place-items-center rounded-lg bg-white/95 text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-cyan-50 hover:text-cyan-700" :aria-label="'Ver ficha de ' + product.nombre" @click="$emit('details', product)"><Info :size="15" /></button>
      </article>
    </div>
    <div v-else class="grid flex-1 place-items-center p-10 text-center"><PackageSearch class="mb-3 text-slate-300" :size="32" /><div><p class="font-semibold text-slate-700">No hay coincidencias</p><p class="mt-1 text-sm text-slate-500">Prueba con otro nombre o código de barras.</p></div></div>
  </section>
</template>
<script setup>
import { computed, ref } from 'vue';
import { Heart, Info, LoaderCircle, Package, PackageSearch, Search } from 'lucide-vue-next';
const props = defineProps({ products: { type: Array, default: () => [] }, loading: Boolean, query: { type: String, default: '' }, favoriteIds: { type: Array, default: () => [] }, recentProducts: { type: Array, default: () => [] } });
defineEmits(['update:query', 'search', 'select', 'details', 'toggle-favorite']);
const brokenImageIds = ref(new Set());
const quickProducts = computed(() => { const favorites = props.products.filter((product) => props.favoriteIds.includes(product.id)); const recent = props.recentProducts.filter((product) => !props.favoriteIds.includes(product.id)); return [...favorites, ...recent].slice(0, 8); });
const money = (value) => Number(value || 0).toFixed(2);
function hideBrokenImage(productId) { brokenImageIds.value = new Set([...brokenImageIds.value, productId]); }
function nextValidLot(product) { return product.lotes?.find((lot) => new Date(lot.fecha_vencimiento + 'T00:00:00') >= new Date(new Date().toDateString())); }
function expiryAlert(product) { const lot = nextValidLot(product); if (!lot) return Number(product.stock_actual) > 0 ? { label: 'Sin lote vigente', class: 'bg-red-600 text-white' } : null; const days = Math.ceil((new Date(lot.fecha_vencimiento + 'T00:00:00') - new Date()) / 86400000); if (days <= 15) return { label: 'Vence pronto', class: 'bg-red-600 text-white' }; if (days <= 60) return { label: 'Vence < 60d', class: 'bg-amber-100 text-amber-800' }; return null; }
</script>
