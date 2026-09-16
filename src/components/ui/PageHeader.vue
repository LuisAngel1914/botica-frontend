<template>
  <header class="page-header">
    <div>
      <p v-if="eyebrow" class="section-kicker">{{ eyebrow }}</p>
      <h2 class="page-title">{{ title }}</h2>
      <p
        v-if="description"
        class="mt-2 max-w-2xl text-xs leading-5 text-slate-500"
      >
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
<script setup>
defineProps({
  eyebrow: String,
  title: { type: String, required: true },
  description: String,
});
</script>
