<template>
  <span class="badge" :class="'badge-' + tone"><slot /></span>
</template>
<script setup>
defineProps({ tone: { type: String, default: "neutral" } });
</script>
