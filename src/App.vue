<template>
  <RouterView v-if="route.meta.public" />
  <AppShell v-else>
    <RouterView />
  </AppShell>
</template>

<script setup>
import { useRoute, RouterView } from 'vue-router';
import AppShell from './components/AppShell.vue';

const route = useRoute();
</script>
