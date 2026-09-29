<template>
  <article class="metric-card">
    <div class="flex items-center justify-between gap-3">
      <p class="text-xs font-medium text-slate-500">{{ label }}</p>
      <component v-if="icon" :is="icon" :size="18" class="text-cyan-700" />
    </div>
    <p
      class="mt-3 text-2xl font-semibold tracking-tight text-slate-950 tabular-nums"
    >
      {{ currency ? currencySymbol + " " + Number(value || 0).toFixed(2) : (value ?? "—") }}
    </p>
    <p v-if="detail" class="mt-2 text-[11px] leading-5 text-slate-500">
      {{ detail }}
    </p>
  </article>
</template>
<script setup>
import { useBusinessConfig } from "../../composables/useBusinessConfig";
const { currencySymbol } = useBusinessConfig();
defineProps({
  label: String,
  value: [String, Number],
  detail: String,
  icon: [Object, Function],
  currency: Boolean,
});
</script>
