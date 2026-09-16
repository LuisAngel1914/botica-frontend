<template>
  <section class="catalog-panel" aria-label="Catálogo de productos">
    <form class="flex gap-2" @submit.prevent="$emit('search')">
      <div class="catalog-search min-w-0 flex-1">
        <Search :size="18" /><input
          ref="searchInput"
          :value="query"
          class="field-control"
          placeholder="Nombre, principio activo o código…"
          aria-label="Buscar producto"
          aria-describedby="search-hint"
          @input="$emit('update:query', $event.target.value)"
        /><button
          v-if="query"
          class="icon-button clear-search"
          type="button"
          aria-label="Limpiar búsqueda"
          @click="
            $emit('update:query', '');
            searchInput?.focus();
          "
        >
          <X :size="16" />
        </button>
      </div>
      <button
        class="btn btn-primary !px-3"
        type="submit"
        aria-label="Buscar producto o añadir código exacto"
      >
        <ScanBarcode :size="21" />
      </button>
    </form>
    <p
      id="search-hint"
      class="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500"
    >
      <ScanBarcode :size="13" />Escanea y pulsa Enter para agregar
      <span class="ml-auto hidden sm:inline"
        >Buscar: <kbd class="rounded border bg-white px-1">F2</kbd></span
      >
    </p>
    <div class="my-4 flex flex-wrap items-center gap-2">
      <button
        v-for="option in filters"
        :key="option.value"
        class="rounded-full border px-3 py-2 text-xs font-medium transition"
        :class="
          filter === option.value
            ? 'border-slate-950 bg-slate-950 text-white'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
        "
        :aria-pressed="filter === option.value"
        @click="filter = option.value"
      >
        {{ option.label }}
      </button>
      <label class="ml-auto min-w-0"
        ><span class="sr-only">Categoría</span
        ><select
          v-model="category"
          class="max-w-40 rounded-lg border bg-white px-2 py-2 text-xs"
        >
          <option value="">Categorías</option>
          <option v-for="value in categories" :key="value">{{ value }}</option>
        </select></label
      >
    </div>
    <div
      v-if="!query && quickProducts.length && filter === 'all' && !category"
      class="mb-4 flex items-center gap-2 overflow-x-auto pb-1"
    >
      <span class="shrink-0 text-[10px] font-semibold text-slate-500"
        >Recientes</span
      ><button
        v-for="product in quickProducts"
        :key="product.id"
        class="shrink-0 rounded-md border bg-white px-3 py-2 text-[11px] text-slate-700 hover:border-cyan-600 disabled:opacity-50"
        :disabled="disabled || sellableStock(product) <= 0"
        @click="$emit('select', product)"
      >
        {{ product.nombre }}
      </button>
    </div>
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-xs font-semibold text-slate-700">
        {{ query ? "Resultados de búsqueda" : "Catálogo de productos" }}
      </h3>
      <span class="text-[10px] text-slate-500" role="status"
        >{{ visibleProducts.length }} productos</span
      >
    </div>
    <SkeletonLoader
      v-if="loading"
      class="catalog-grid !p-0"
      :rows="6"
      tiles
      label="Cargando catálogo…"
    />
    <EmptyState
      v-else-if="error"
      title="No pudimos cargar el catálogo"
      description="Comprueba tu conexión y vuelve a intentar."
      ><button class="btn btn-secondary" @click="$emit('retry')">
        Reintentar
      </button></EmptyState
    >
    <div v-else-if="visibleProducts.length" class="catalog-grid">
      <article
        v-for="product in visibleProducts"
        :key="product.id"
        class="product-card"
      >
        <div class="relative">
          <button
            class="block w-full"
            :aria-label="'Ver ficha de ' + product.nombre"
            @click="$emit('details', product)"
          >
            <ProductImage
              :src="product.imagen_url"
              :name="product.nombre"
            /></button
          ><button
            class="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-500 hover:text-cyan-700"
            :aria-label="'Favorito: ' + product.nombre"
            :aria-pressed="favoriteIds.includes(product.id)"
            @click="$emit('toggle-favorite', product)"
          >
            <Star
              :size="15"
              :fill="favoriteIds.includes(product.id) ? 'currentColor' : 'none'"
            />
          </button>
        </div>
        <div class="product-card-body">
          <div>
            <h4 class="product-card-title">{{ product.nombre }}</h4>
            <p class="mt-1 truncate text-[10px] text-slate-500">
              {{ product.presentacion || "Presentación no especificada" }}
            </p>
          </div>
          <div class="flex flex-wrap gap-1">
            <AppBadge :tone="stockTone(product)">{{
              sellableStock(product) > 0
                ? sellableStock(product) + " disponibles"
                : "Sin stock"
            }}</AppBadge
            ><AppBadge v-if="requiresPrescription(product)" tone="warning"
              >Receta</AppBadge
            >
          </div>
          <p
            class="flex items-center gap-1 text-[10px]"
            :class="
              expiryInfo(product).tone === 'danger'
                ? 'text-red-700'
                : expiryInfo(product).tone === 'warning'
                  ? 'text-amber-800'
                  : 'text-slate-500'
            "
          >
            <CalendarClock :size="12" />{{ expiryInfo(product).label }}
          </p>
          <div class="product-card-footer">
            <strong
              class="text-base font-semibold tracking-tight text-slate-950 tabular-nums"
              >S/ {{ money(product.precio_venta) }}</strong
            ><button
              class="btn btn-primary !min-h-9 !gap-1 !px-2 !py-2 !text-[10px]"
              :disabled="disabled || sellableStock(product) <= 0"
              :aria-label="'Agregar ' + product.nombre"
              @click="$emit('select', product)"
            >
              <Plus :size="14" />Agregar
            </button>
          </div>
        </div>
      </article>
    </div>
    <EmptyState
      v-else
      title="No hay productos para esta búsqueda"
      description="Prueba otro nombre, código o cambia los filtros."
      ><button class="btn btn-secondary" @click="resetFilters">
        Limpiar filtros
      </button></EmptyState
    >
  </section>
</template>
<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  CalendarClock,
  Plus,
  ScanBarcode,
  Search,
  Star,
  X,
} from "lucide-vue-next";
import AppBadge from "../ui/AppBadge.vue";
import EmptyState from "../ui/EmptyState.vue";
import ProductImage from "../ui/ProductImage.vue";
import SkeletonLoader from "../ui/SkeletonLoader.vue";
import {
  expiryInfo,
  money,
  requiresPrescription,
  sellableStock,
} from "../../utils/productPresentation";
const props = defineProps({
  products: { type: Array, default: () => [] },
  loading: Boolean,
  error: Boolean,
  disabled: Boolean,
  query: { type: String, default: "" },
  favoriteIds: { type: Array, default: () => [] },
  recentProducts: { type: Array, default: () => [] },
});
const emit = defineEmits([
  "update:query",
  "search",
  "select",
  "details",
  "toggle-favorite",
  "retry",
  "focus-search",
]);
const searchInput = ref(null);
const filter = ref("all");
const category = ref("");
const filters = [
  { value: "all", label: "Todos" },
  { value: "available", label: "Disponibles" },
  { value: "favorites", label: "Favoritos" },
  { value: "prescription", label: "Con receta" },
];
const categories = computed(() =>
  [...new Set(props.products.map((p) => p.categoria).filter(Boolean))].sort(),
);
const quickProducts = computed(() => props.recentProducts.slice(0, 5));
const visibleProducts = computed(() =>
  props.products.filter(
    (p) =>
      (!category.value || p.categoria === category.value) &&
      (filter.value === "all" ||
        (filter.value === "available" && sellableStock(p) > 0) ||
        (filter.value === "favorites" && props.favoriteIds.includes(p.id)) ||
        (filter.value === "prescription" && requiresPrescription(p))),
  ),
);
const stockTone = (p) =>
  sellableStock(p) <= 0
    ? "danger"
    : sellableStock(p) <= Number(p.stock_minimo ?? 5)
      ? "warning"
      : "success";
function resetFilters() {
  category.value = "";
  filter.value = "all";
  emit("update:query", "");
}
function onKey(event) {
  if (event.key === "F2" && !document.querySelector("dialog[open]")) {
    event.preventDefault();
    emit("focus-search");
    requestAnimationFrame(() => searchInput.value?.focus());
  }
}
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>
