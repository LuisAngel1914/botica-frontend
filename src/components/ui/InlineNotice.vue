<template>
  <div v-if="notice" class="mb-5 flex items-start gap-3 rounded-2xl border p-4 text-sm" :class="notice.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'" role="status"><component :is="notice.type === 'error' ? CircleAlert : CircleCheck" class="mt-0.5 shrink-0" :size="18" /><span class="flex-1">{{ notice.message }}</span><button class="rounded-lg px-2 font-bold hover:bg-black/5" aria-label="Cerrar aviso" @click="$emit('dismiss')">×</button></div>
</template>
<script setup>
import { CircleAlert, CircleCheck } from 'lucide-vue-next';
defineProps({ notice: Object });
defineEmits(['dismiss']);
</script>
