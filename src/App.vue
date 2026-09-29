<template>
  <RouterView v-if="route.meta.public" />
  <AppShell v-else>
    <RouterView />
  </AppShell>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute, RouterView } from 'vue-router';
import AppShell from './components/AppShell.vue';
import { loadBusinessConfig } from './composables/useBusinessConfig';

const route = useRoute();
onMounted(() => loadBusinessConfig());
</script>
