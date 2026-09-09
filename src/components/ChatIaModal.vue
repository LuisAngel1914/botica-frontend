<template>
  <div class="fixed bottom-5 right-5 z-40">
    <button class="grid h-13 w-13 place-items-center rounded-2xl bg-slate-950 text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-cyan-700 focus-visible:outline-cyan-400" :aria-expanded="open" aria-controls="assistant-panel" @click="open = !open">
      <MessageCircle v-if="!open" :size="22" /><X v-else :size="22" /><span class="sr-only">{{ open ? 'Cerrar asistente' : 'Abrir asistente' }}</span>
    </button>
    <section v-if="open" id="assistant-panel" class="absolute bottom-16 right-0 flex h-[min(32rem,calc(100vh-7rem))] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <header class="flex items-center gap-3 bg-slate-950 p-4 text-white"><span class="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400 text-slate-950"><Sparkles :size="18" /></span><div><h2 class="text-sm font-semibold">Asistente farmacéutico</h2><p class="text-xs text-slate-400">Consulta stock y equivalentes</p></div></header>
      <div ref="chatBox" class="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4" aria-live="polite">
        <div v-for="(message, index) in messages" :key="index" class="flex" :class="message.role === 'user' ? 'justify-end' : 'justify-start'"><p class="max-w-[85%] rounded-2xl px-3 py-2.5 text-sm leading-6" :class="message.role === 'user' ? 'rounded-br-sm bg-cyan-700 text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-700'">{{ message.text }}</p></div>
        <div v-if="loading" class="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle :size="16" class="animate-spin" /> Consultando…</div>
      </div>
      <form class="flex gap-2 border-t border-slate-200 p-3" @submit.prevent="sendMessage"><input v-model="draft" class="field-control min-w-0 py-2" :disabled="loading" placeholder="Escribe tu consulta…" aria-label="Mensaje al asistente" /><button class="btn btn-primary px-3 py-2" :disabled="loading || !draft.trim()" aria-label="Enviar mensaje"><Send :size="17" /></button></form>
    </section>
  </div>
</template>

<script setup>
import { nextTick, ref } from 'vue';
import { LoaderCircle, MessageCircle, Send, Sparkles, X } from 'lucide-vue-next';
import api from '../api/axios';

const open = ref(false);
const loading = ref(false);
const draft = ref('');
const chatBox = ref(null);
const messages = ref([{ role: 'assistant', text: 'Hola, soy tu asistente farmacéutico. Puedo ayudarte con productos, stock y equivalentes.' }]);

async function scrollToBottom() { await nextTick(); if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight; }
async function sendMessage() {
  const text = draft.value.trim();
  if (!text || loading.value) return;
  messages.value.push({ role: 'user', text });
  draft.value = '';
  loading.value = true;
  await scrollToBottom();
  try {
    const { data } = await api.post('/chat', { mensaje: text });
    messages.value.push({ role: 'assistant', text: data.respuesta || 'No recibí una respuesta válida. Intenta nuevamente.' });
  } catch {
    messages.value.push({ role: 'assistant', text: 'No pude consultar el asistente en este momento. Inténtalo nuevamente.' });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
}
</script>
