<template>
  <header class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div><p v-if="eyebrow" class="text-xs font-semibold uppercase tracking-wider text-cyan-700">{{ eyebrow }}</p><h2 class="mt-1 text-2xl font-bold tracking-tight text-slate-900">{{ title }}</h2><p v-if="description" class="mt-1 text-sm text-slate-500">{{ description }}</p></div>
    <div v-if="$slots.actions" class="flex flex-wrap gap-2"><slot name="actions" /></div>
  </header>
</template>
<script setup>
defineProps({ eyebrow: String, title: { type: String, required: true }, description: String });
</script>
