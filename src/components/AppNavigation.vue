<template>
  <nav aria-label="Navegación principal" class="overflow-y-auto">
    <div v-for="group in groups" :key="group.label">
      <p class="nav-group-label">{{ group.label }}</p>
      <RouterLink
        v-for="item in group.items"
        :key="item.to"
        :to="item.to"
        class="workspace-nav-link"
        @click="$emit('navigate')"
        ><component :is="item.icon" :size="17" :stroke-width="1.6" />{{
          item.label
        }}</RouterLink
      >
    </div>
  </nav>
</template>
<script setup>
defineProps({ groups: { type: Array, required: true } });
defineEmits(["navigate"]);
</script>
