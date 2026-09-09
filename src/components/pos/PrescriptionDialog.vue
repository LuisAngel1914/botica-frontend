<template>
  <div v-if="open" class="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="prescription-title">
    <form class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" @submit.prevent="$emit('confirm')"><div class="mb-5 flex items-start gap-3"><span class="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-700"><FileText :size="20" /></span><div><h2 id="prescription-title" class="font-bold text-slate-900">Validar receta médica</h2><p class="mt-1 text-sm text-slate-500">{{ product?.nombre }} requiere prescripción.</p></div></div><div class="space-y-4"><div><label class="field-label">Nombre del médico o cirujano</label><input :value="data.nombre_medico" class="field-control" required placeholder="Dr. Juan Pérez" @input="$emit('update:data', { ...data, nombre_medico: $event.target.value })" /></div><div><label class="field-label">Colegiatura CMP / COP</label><input :value="data.cmp_medico" class="field-control" required placeholder="Ej. 084920" @input="$emit('update:data', { ...data, cmp_medico: $event.target.value })" /></div></div><div class="mt-6 flex justify-end gap-3"><button class="btn btn-secondary" type="button" @click="$emit('close')">Cancelar</button><button class="btn bg-red-600 text-white hover:bg-red-700" type="submit">Añadir a venta</button></div></form>
  </div>
</template>
<script setup>
import { FileText } from 'lucide-vue-next';
defineProps({ open: Boolean, product: Object, data: { type: Object, default: () => ({}) } });
defineEmits(['close', 'confirm', 'update:data']);
</script>
