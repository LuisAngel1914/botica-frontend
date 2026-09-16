<template>
  <div
    class="skeleton-loader"
    role="status"
    :aria-label="label"
    aria-busy="true"
  >
    <span class="sr-only">{{ label }}</span>
    <div
      v-for="n in rows"
      :key="n"
      class="skeleton-line"
      :class="{ 'skeleton-tile': tiles }"
      aria-hidden="true"
    />
  </div>
</template>
<script setup>
defineProps({
  rows: { type: Number, default: 4 },
  tiles: Boolean,
  label: { type: String, default: "Cargando información…" },
});
</script>
