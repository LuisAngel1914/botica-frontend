<template>
  <div class="mx-auto max-w-3xl">
    <PageHeader eyebrow="Operaciones diarias" title="Control de caja" description="Abre turnos, controla ingresos y realiza el arqueo con trazabilidad." />
    <InlineNotice :notice="notice" @dismiss="notice = null" />

    <div v-if="loading" class="app-card grid min-h-72 place-items-center text-sm text-slate-500"><LoaderCircle class="mb-2 animate-spin text-cyan-700" :size="24" />Consultando el estado de caja…</div>

    <section v-else-if="status === 'cerrada'" class="app-card overflow-hidden">
      <div class="border-b border-slate-100 bg-amber-50 p-5"><div class="flex gap-3"><CircleAlert class="shrink-0 text-amber-700" :size="22" /><div><h3 class="font-bold text-amber-950">Caja cerrada</h3><p class="mt-1 text-sm text-amber-800">Registra el fondo inicial para iniciar un nuevo turno de ventas.</p></div></div></div>
      <form class="p-5 sm:p-6" @submit.prevent="openCashRegister"><label class="field-label" for="opening-amount">Monto inicial en caja</label><div class="relative max-w-sm"><span class="absolute left-3 top-2.5 text-sm font-semibold text-slate-400">S/</span><input id="opening-amount" v-model.number="openingAmount" class="field-control pl-9" min="0" step="0.10" type="number" required placeholder="0.00" /></div><button class="btn btn-primary mt-5" :disabled="saving || openingAmount === null || openingAmount < 0"><LoaderCircle v-if="saving" class="animate-spin" :size="18" /><Unlock v-else :size="18" />{{ saving ? 'Abriendo caja…' : 'Abrir caja' }}</button></form>
    </section>

    <template v-else>
      <section class="app-card overflow-hidden"><div class="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div class="flex items-center gap-3"><span class="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CircleCheck :size="21" /></span><div><h3 class="font-bold text-slate-900">Caja abierta</h3><p class="text-sm text-slate-500">Desde {{ formatDate(cashData.caja?.fecha_apertura) }}</p></div></div><span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Turno activo</span></div>
        <div class="grid gap-3 p-5 sm:grid-cols-3"><Metric label="Fondo inicial" :value="cashData.monto_inicial" /><Metric label="Ventas en efectivo" :value="cashData.ventas_efectivo" tone="cyan" /><Metric label="Pagos digitales" :value="cashData.ventas_digitales" tone="violet" /></div>
        <div class="mx-5 mb-5 rounded-2xl bg-slate-950 p-5 text-white"><p class="text-sm text-slate-300">Efectivo esperado en cajón</p><div class="mt-1 flex items-end justify-between gap-3"><span class="text-xs text-slate-400">Fondo inicial + ventas en efectivo</span><strong class="text-3xl font-black">S/ {{ money(cashData.monto_esperado) }}</strong></div></div>
      </section>
      <section class="app-card mt-5 p-5 sm:p-6"><div class="mb-5"><p class="text-xs font-semibold uppercase tracking-wider text-cyan-700">Cierre de turno</p><h3 class="mt-1 text-lg font-bold text-slate-900">Realizar arqueo</h3><p class="mt-1 text-sm text-slate-500">Cuenta el efectivo físico antes de confirmar el cierre.</p></div><form @submit.prevent="confirmClose = true"><label class="field-label" for="closing-amount">Efectivo contado</label><div class="relative max-w-sm"><span class="absolute left-3 top-2.5 text-sm font-semibold text-slate-400">S/</span><input id="closing-amount" v-model.number="closingAmount" class="field-control pl-9" min="0" step="0.10" type="number" required placeholder="0.00" /></div><button class="btn mt-5 bg-red-600 text-white hover:bg-red-700" :disabled="closingAmount === null || closingAmount < 0"><Lock :size="18" />Cerrar caja</button></form></section>
    </template>

    <div v-if="confirmClose" class="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div class="flex gap-3"><CircleAlert class="text-amber-600" :size="22" /><div><h2 class="font-bold text-slate-900">¿Confirmar cierre de caja?</h2><p class="mt-1 text-sm text-slate-500">Esta acción cerrará el turno actual con el monto contado de S/ {{ money(closingAmount) }}.</p></div></div><div class="mt-6 flex justify-end gap-3"><button class="btn btn-secondary" @click="confirmClose = false">Cancelar</button><button class="btn bg-red-600 text-white hover:bg-red-700" :disabled="saving" @click="closeCashRegister">{{ saving ? 'Cerrando…' : 'Confirmar cierre' }}</button></div></div></div>
  </div>
</template>
<script setup>
import { defineComponent, h, onMounted, ref } from 'vue';
import { CircleAlert, CircleCheck, LoaderCircle, Lock, Unlock } from 'lucide-vue-next';
import api from '../api/axios';
import InlineNotice from '../components/ui/InlineNotice.vue';
import PageHeader from '../components/ui/PageHeader.vue';

const Metric = defineComponent({ props: { label: String, value: [Number, String], tone: String }, setup(props) { return () => h('div', { class: 'rounded-2xl border border-slate-100 bg-slate-50 p-4' }, [h('p', { class: 'text-xs font-semibold text-slate-500' }, props.label), h('p', { class: ['mt-1 text-xl font-black', props.tone === 'cyan' ? 'text-cyan-700' : props.tone === 'violet' ? 'text-violet-700' : 'text-slate-900'] }, 'S/ ' + money(props.value))]); } });
const status = ref('cerrada'), loading = ref(true), saving = ref(false), cashData = ref({}), openingAmount = ref(0), closingAmount = ref(null), confirmClose = ref(false), notice = ref(null);
const money = (value) => Number(value || 0).toFixed(2);
const formatDate = (value) => value ? new Date(value).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
function show(message, type = 'success') { notice.value = { message, type }; }
async function loadStatus() { loading.value = true; try { const { data } = await api.get('/caja/estado'); status.value = data.estado; cashData.value = data; } catch { show('No se pudo consultar el estado de caja.', 'error'); } finally { loading.value = false; } }
async function openCashRegister() { saving.value = true; try { await api.post('/caja/abrir', { monto_inicial: openingAmount.value }); show('Caja abierta correctamente.'); await loadStatus(); } catch (error) { show(error.response?.data?.message || 'No fue posible abrir la caja.', 'error'); } finally { saving.value = false; } }
async function closeCashRegister() { saving.value = true; try { const { data } = await api.post('/caja/cerrar', { monto_final: closingAmount.value }); const difference = data.resumen?.diferencia; show('Caja cerrada.' + (difference !== undefined ? ' Diferencia de arqueo: S/ ' + money(difference) + '.' : '')); confirmClose.value = false; closingAmount.value = null; await loadStatus(); } catch (error) { show(error.response?.data?.message || 'No fue posible cerrar la caja.', 'error'); } finally { saving.value = false; } }
onMounted(loadStatus);
</script>