<template>
  <div class="fixed bottom-20 right-5 z-40 lg:bottom-5">
    <button class="grid h-13 w-13 place-items-center rounded-2xl bg-slate-950 text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-cyan-700 focus-visible:outline-cyan-400" :aria-expanded="open" aria-controls="assistant-panel" @click="open = !open">
      <MessageCircle v-if="!open" :size="22" /><X v-else :size="22" /><span class="sr-only">{{ open ? 'Cerrar asistente' : 'Abrir asistente' }}</span>
    </button>
    <section v-if="open" id="assistant-panel" role="dialog" aria-modal="false" aria-label="Asistente operativo de Botica L y L" class="absolute bottom-16 right-0 flex h-[min(36rem,calc(100vh-7rem))] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <header class="flex items-center gap-3 bg-slate-950 p-4 text-white"><span class="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400 text-slate-950"><Sparkles :size="18" /></span><div class="min-w-0 flex-1"><h2 class="text-sm font-semibold">Asistente de Botica L y L</h2><p class="truncate text-xs text-slate-400">Consultas operativas según tu acceso</p></div><button v-if="messages.length > 1" class="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Limpiar conversación" title="Limpiar conversación" @click="clearConversation"><Trash2 :size="16" /></button></header>
      <div ref="chatBox" class="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4" aria-live="polite">
        <div v-for="(message, index) in messages" :key="index" class="flex" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
          <div class="max-w-[92%]">
            <p class="rounded-2xl px-3 py-2.5 text-sm leading-6" :class="message.role === 'user' ? 'rounded-br-sm bg-cyan-700 text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-700'">{{ message.text }}</p>
            <article v-if="message.presentation" class="mt-2 overflow-hidden rounded-xl border bg-white shadow-sm" :class="presentationBorder(message.presentation.tone)">
              <div class="flex items-center gap-2 border-b px-3 py-2" :class="presentationHeader(message.presentation.tone)"><BarChart3 :size="15" /><p class="text-xs font-bold">{{ message.presentation.title }}</p></div>
              <div v-if="message.presentation.metrics?.length" class="grid gap-px bg-slate-100" :class="message.presentation.metrics.length > 2 ? 'grid-cols-3' : 'grid-cols-2'"><div v-for="item in message.presentation.metrics" :key="item.label" class="min-w-0 bg-white px-3 py-2.5"><p class="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">{{ item.label }}</p><p class="mt-1 truncate text-sm font-black" :class="metricTone(item.tone)">{{ item.value }}</p></div></div>
              <dl v-if="message.presentation.details?.length" class="divide-y divide-slate-100 px-3 py-1"><div v-for="detail in message.presentation.details" :key="detail[0]" class="flex items-start justify-between gap-3 py-2 text-xs"><dt class="shrink-0 text-slate-500">{{ detail[0] }}</dt><dd class="text-right font-semibold text-slate-800">{{ detail[1] }}</dd></div></dl>
              <button v-if="message.presentation.action" class="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 px-3 py-2 text-xs font-bold text-cyan-700 transition hover:bg-cyan-50" @click="goTo(message.presentation.action.route)">{{ message.presentation.action.label }} <ArrowUpRight :size="14" /></button>
            </article>
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
      <div class="border-t border-slate-200 bg-white p-3"><p class="mb-2 text-[11px] leading-4 text-slate-500">Solo responde sobre Botica L y L. No ejecuta cambios, diagnósticos, dosis ni recomendaciones terapéuticas.</p><form class="flex gap-2" @submit.prevent="sendMessage"><input v-model="draft" class="field-control min-w-0 py-2" :disabled="loading" placeholder="Ej. Estado de caja" aria-label="Mensaje al asistente" /><button class="btn btn-primary px-3 py-2" :disabled="loading || !draft.trim()" aria-label="Enviar mensaje"><Send :size="17" /></button></form></div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowUpRight, BarChart3, LoaderCircle, MessageCircle, Package, Send, Sparkles, Trash2, X } from 'lucide-vue-next';
import api from '../api/axios';
import { createAssistantPresentation } from '../utils/assistantPresentation';

const open = ref(false);
const props = defineProps({ context: { type: String, default: 'pos' } });
const router = useRouter();
const loading = ref(false);
const draft = ref('');
const chatBox = ref(null);
const initialMessage = () => ({ role: 'assistant', text: 'Hola. Puedo ayudarte con productos, caja, ventas, inventario, clientes, reportes y usuarios, según tus permisos. No atiendo consultas ajenas a Botica L y L ni ejecuto cambios desde este chat.' });
const messages = ref([initialMessage()]);
const suggestions = computed(() => ({
  pos: ['Precio de paracetamol', 'Stock de ibuprofeno', 'Estado de caja'],
  caja: ['Estado de caja', 'Ventas de hoy', 'Efectivo registrado'],
  ventas: ['Ventas de hoy', 'Reporte de hoy', 'Estado de caja'],
  clientes: ['Consultar cliente por DNI', 'Ventas de hoy', 'Productos disponibles'],
  compras: ['Alertas de inventario', 'Lotes por vencer', 'Productos disponibles'],
  inventario: ['Alertas de inventario', 'Lotes vencidos', 'Stock crítico'],
  reportes: ['Reporte de hoy', 'Ventas de hoy', 'Alertas de inventario'],
  actividad: ['Ventas de hoy', 'Estado de caja', 'Alertas de inventario'],
  usuarios: ['Usuarios activos', 'Reporte de hoy', 'Estado de caja'],
}[props.context] || ['Estado de caja', 'Ventas de hoy', 'Productos disponibles']));

async function scrollToBottom() { await nextTick(); if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight; }
const money = (value) => Number(value || 0).toFixed(2);
const conditionLabel = (condition) => ({ libre: 'Venta libre', con_receta: 'Venta bajo receta', receta_retenida: 'Receta retenida' }[condition] || 'Condición de venta por confirmar');
const metricTone = (tone) => ({ accent: 'text-cyan-700', success: 'text-emerald-700', warning: 'text-amber-700', danger: 'text-red-700' }[tone] || 'text-slate-800');
const presentationBorder = (tone) => ({ success: 'border-emerald-200', warning: 'border-amber-200', accent: 'border-cyan-200' }[tone] || 'border-slate-200');
const presentationHeader = (tone) => ({ success: 'border-emerald-100 bg-emerald-50 text-emerald-800', warning: 'border-amber-100 bg-amber-50 text-amber-800', accent: 'border-cyan-100 bg-cyan-50 text-cyan-800' }[tone] || 'border-slate-100 bg-slate-50 text-slate-700');
function clearConversation() { messages.value = [initialMessage()]; }
async function goTo(route) { open.value = false; await router.push({ name: route }); }
function onKeydown(event) { if (event.key === 'Escape' && open.value) open.value = false; }
onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
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
    messages.value.push({ role: 'assistant', text: data.respuesta || 'No recibí una respuesta válida. Intenta nuevamente.', products: data.productos || [], presentation: createAssistantPresentation(data.code, data.data) });
  } catch {
    messages.value.push({ role: 'assistant', text: 'No pude consultar el asistente en este momento. Inténtalo nuevamente.' });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
}
</script>
