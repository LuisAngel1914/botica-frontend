<template>
  <div class="data-table-scroll" role="region" :aria-label="label" tabindex="0">
    <table class="data-table" v-bind="$attrs">
      <caption class="sr-only">
        {{
          label
        }}
      </caption>
      <slot />
    </table>
  </div>
</template>
<script setup>
defineOptions({ inheritAttrs: false });
defineProps({ label: { type: String, default: "Listado de registros" } });
</script>
