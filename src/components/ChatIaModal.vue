<template>
  <div class="fixed bottom-5 right-5 z-40">
    <button class="grid h-13 w-13 place-items-center rounded-2xl bg-slate-950 text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-cyan-700 focus-visible:outline-cyan-400" :aria-expanded="open" aria-controls="assistant-panel" @click="open = !open">
      <MessageCircle v-if="!open" :size="22" /><X v-else :size="22" /><span class="sr-only">{{ open ? 'Cerrar asistente' : 'Abrir asistente' }}</span>
    </button>
    <section v-if="open" id="assistant-panel" class="absolute bottom-16 right-0 flex h-[min(36rem,calc(100vh-7rem))] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <header class="flex items-center gap-3 bg-slate-950 p-4 text-white"><span class="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400 text-slate-950"><Sparkles :size="18" /></span><div><h2 class="text-sm font-semibold">Asistente de botica</h2><p class="text-xs text-slate-400">Catálogo, stock vigente y precios</p></div></header>
      <div ref="chatBox" class="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4" aria-live="polite">
        <div v-for="(message, index) in messages" :key="index" class="flex" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
          <div class="max-w-[92%]">
            <p class="rounded-2xl px-3 py-2.5 text-sm leading-6" :class="message.role === 'user' ? 'rounded-br-sm bg-cyan-700 text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-700'">{{ message.text }}</p>
            <div v-if="message.products?.length" class="mt-2 space-y-2">
              <article v-for="product in message.products" :key="product.id" class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div class="flex gap-3 p-3">
                  <img v-if="product.imagen_url" :src="product.imagen_url" :alt="product.nombre" class="h-12 w-12 rounded-lg bg-slate-100 object-cover" @error="$event.target.style.display = 'none'" />
                  <span v-else class="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-700"><Package :size="20" /></span>
                  <div class="min-w-0 flex-1"><p class="truncate text-sm font-bold text-slate-800">{{ product.nombre }}</p><p class="mt-0.5 truncate text-xs text-slate-500">{{ product.principio_activo || product.presentacion || 'Producto de botica' }}</p><div class="mt-2 flex items-center justify-between gap-2"><span class="text-xs font-semibold text-emerald-700">{{ product.stock_disponible }} vigentes</span><span class="text-sm font-black text-cyan-700">S/ {{ money(product.precio_venta) }}</span></div></div>
                </div>
                <p class="border-t border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600">{{ conditionLabel(product.condicion_venta) }}</p>
              </article>
            </div>
          </div>
        </div>
        <div v-if="messages.length === 1 && !loading" class="flex flex-wrap gap-2 pt-1"><button v-for="suggestion in suggestions" :key="suggestion" class="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-50" @click="sendSuggestion(suggestion)">{{ suggestion }}</button></div>
        <div v-if="loading" class="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle :size="16" class="animate-spin" /> Consultando…</div>
      </div>
      <div class="border-t border-slate-200 bg-white p-3"><p class="mb-2 text-[11px] leading-4 text-slate-500">No brinda diagnósticos, dosis ni recomendaciones terapéuticas.</p><form class="flex gap-2" @submit.prevent="sendMessage"><input v-model="draft" class="field-control min-w-0 py-2" :disabled="loading" placeholder="Ej. Precio de paracetamol" aria-label="Mensaje al asistente" /><button class="btn btn-primary px-3 py-2" :disabled="loading || !draft.trim()" aria-label="Enviar mensaje"><Send :size="17" /></button></form></div>
    </section>
  </div>
</template>

<script setup>
import { nextTick, ref } from 'vue';
import { LoaderCircle, MessageCircle, Package, Send, Sparkles, X } from 'lucide-vue-next';
import api from '../api/axios';

const open = ref(false);
const loading = ref(false);
const draft = ref('');
const chatBox = ref(null);
const messages = ref([{ role: 'assistant', text: 'Hola. Puedo ayudarte a consultar productos, stock vigente, precios, presentación, principio activo y condición de venta.' }]);
const suggestions = ['Productos disponibles', 'Precio de paracetamol', 'Stock de ibuprofeno'];

async function scrollToBottom() { await nextTick(); if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight; }
const money = (value) => Number(value || 0).toFixed(2);
const conditionLabel = (condition) => ({ libre: 'Venta libre', con_receta: 'Venta bajo receta', receta_retenida: 'Receta retenida' }[condition] || 'Condición de venta por confirmar');
async function sendSuggestion(suggestion) { draft.value = suggestion; await sendMessage(); }
async function sendMessage() {
  const text = draft.value.trim();
  if (!text || loading.value) return;
  messages.value.push({ role: 'user', text });
  draft.value = '';
  loading.value = true;
  await scrollToBottom();
  try {
    const { data } = await api.post('/chat', { mensaje: text });
    messages.value.push({ role: 'assistant', text: data.respuesta || 'No recibí una respuesta válida. Intenta nuevamente.', products: data.productos || [] });
  } catch {
    messages.value.push({ role: 'assistant', text: 'No pude consultar el asistente en este momento. Inténtalo nuevamente.' });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
}
</script>
