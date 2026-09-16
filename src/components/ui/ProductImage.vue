<template>
  <div class="product-image">
    <img
      v-if="src && !broken"
      :src="src"
      :alt="name"
      loading="lazy"
      decoding="async"
      @error="broken = true"
    />
    <div
      v-else
      class="product-image-fallback"
      :aria-label="'Sin imagen de ' + name"
      role="img"
    >
      <Pill :size="30" :stroke-width="1.25" /><span>BOTICA L Y L</span>
    </div>
  </div>
</template>
<script setup>
import { ref, watch } from "vue";
import { Pill } from "lucide-vue-next";
const props = defineProps({
  src: String,
  name: { type: String, default: "producto" },
});
const broken = ref(false);
watch(
  () => props.src,
  () => {
    broken.value = false;
  },
);
</script>
