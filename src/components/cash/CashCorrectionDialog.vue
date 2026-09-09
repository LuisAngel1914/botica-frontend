<template>
  <div>
    <button class="mt-3 text-sm font-semibold text-cyan-700 hover:text-cyan-800" @click="open">Corregir último cierre</button>
    <div v-if="visible" class="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"><form class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" @submit.prevent="submit"><h2 class="text-lg font-bold">Corrección de cierre</h2><p class="mt-1 text-sm text-slate-500">El cierre original no será modificado.</p><p v-if="cash" class="mt-4 rounded-xl bg-slate-50 p-3 text-sm">Original: <strong>S/ {{ money(cash.monto_final) }}</strong></p><label class="field-label mt-4">Monto corregido</label><input v-model.number="amount" class="field-control" type="number" min="0" step="0.10" required /><label class="field-label mt-4">Motivo</label><textarea v-model.trim="reason" class="field-control min-h-24" minlength="10" required placeholder="Explica el error y la corrección." /><p v-if="error" class="mt-2 text-sm text-red-700">{{ error }}</p><div class="mt-5 flex justify-end gap-2"><button class="btn btn-secondary" type="button" @click="visible=false">Cancelar</button><button class="btn btn-primary" :disabled="saving">Registrar corrección</button></div></form></div>
  </div>
</template>
<script setup>
import { ref } from 'vue'; import api from '../../api/axios';
const emit=defineEmits(['saved']); const visible=ref(false),cash=ref(null),amount=ref(null),reason=ref(''),saving=ref(false),error=ref('');
const money=v=>Number(v||0).toFixed(2);
async function open(){error.value='';try{const {data}=await api.get('/caja/ultimo-cierre');cash.value=data;amount.value=Number(data.monto_final);}catch(e){error.value=e.response?.data?.message||'No se encontró un cierre.';}visible.value=true;}
async function submit(){saving.value=true;error.value='';try{await api.post('/caja/'+cash.value.id+'/correcciones',{monto_final_corregido:amount.value,motivo:reason.value});visible.value=false;emit('saved');}catch(e){error.value=e.response?.data?.message||'No se pudo registrar la corrección.';}finally{saving.value=false;}}
</script>