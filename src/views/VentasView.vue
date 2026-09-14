<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <PageHeader eyebrow="Operaciones comerciales" title="Historial de ventas" description="Consulta, filtra y reimprime comprobantes. Las anulaciones requieren autorización y motivo." />

    <InlineNotice :notice="notice" @dismiss="notice = null" />

    <div class="app-card flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
      <label class="flex-1"><span class="field-label">Buscar</span><input v-model="search" class="field-control" placeholder="Cliente, documento o número de venta" @keyup.enter="loadSales(1)" /></label>
      <label><span class="field-label">Desde</span><input v-model="from" class="field-control" type="date" /></label>
      <label><span class="field-label">Hasta</span><input v-model="to" class="field-control" type="date" /></label>
      <button class="btn btn-secondary" :disabled="loading" @click="loadSales(1)">Aplicar filtros</button>
    </div>

    <section class="app-card overflow-hidden">
      <div v-if="loading" class="grid min-h-64 place-items-center text-sm text-slate-500">Cargando ventas…</div>
      <div v-else-if="filteredSales.length" class="overflow-x-auto">
        <table class="w-full min-w-[760px] text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th class="p-4">Venta</th><th class="p-4">Cliente</th><th class="p-4">Pago</th><th class="p-4">Estado</th><th class="p-4 text-right">Total</th><th class="p-4 text-right">Acciones</th></tr></thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="sale in filteredSales" :key="sale.id" class="hover:bg-slate-50/70">
              <td class="p-4"><p class="font-bold text-slate-800">#{{ sale.id }}</p><p class="mt-0.5 text-xs text-slate-500">{{ formatDate(sale.created_at) }}</p></td>
              <td class="p-4"><p class="font-semibold text-slate-700">{{ clientName(sale) }}</p><p v-if="clientDocument(sale)" class="mt-0.5 text-xs text-slate-400">{{ clientDocument(sale) }}</p></td>
              <td class="p-4"><span class="rounded-lg px-2.5 py-1 text-xs font-bold" :class="paymentClass(sale.metodo_pago)">{{ sale.metodo_pago }}</span></td>
              <td class="p-4"><span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="sale.estado === 'anulada' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'">{{ sale.estado === 'anulada' ? 'Anulada' : 'Completada' }}</span></td>
              <td class="p-4 text-right font-black text-slate-900">S/ {{ money(sale.total || localTotal(sale)) }}</td>
              <td class="p-4"><div class="flex justify-end gap-2"><button class="btn btn-secondary !px-3 !py-2 text-xs" @click="openDetail(sale)">Detalle</button><button class="btn btn-secondary !px-3 !py-2 text-xs" @click="downloadTicket(sale.id)">Ticket</button><button v-if="canReturn(sale)" class="btn !bg-amber-600 !px-3 !py-2 text-xs !text-white hover:!bg-amber-700" @click="openReturn(sale)">Devolver</button><button v-if="isAdmin && sale.estado !== 'anulada' && !(sale.devoluciones || []).length" class="btn !bg-red-600 !px-3 !py-2 text-xs !text-white hover:!bg-red-700" @click="openCancel(sale)">Anular</button></div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="grid min-h-64 place-items-center p-6 text-center text-sm text-slate-500">No se encontraron ventas en el período indicado.</div>
    </section>

    <nav v-if="pagination.lastPage > 1" class="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between" aria-label="Paginación de ventas">
      <p>Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} ventas</p>
      <div class="flex items-center gap-2">
        <button class="btn btn-secondary !px-3 !py-2 text-xs" :disabled="loading || pagination.currentPage <= 1" @click="loadSales(pagination.currentPage - 1)">Anterior</button>
        <span class="min-w-24 text-center text-xs font-semibold">Página {{ pagination.currentPage }} de {{ pagination.lastPage }}</span>
        <button class="btn btn-secondary !px-3 !py-2 text-xs" :disabled="loading || pagination.currentPage >= pagination.lastPage" @click="loadSales(pagination.currentPage + 1)">Siguiente</button>
      </div>
    </nav>

    <div v-if="selectedSale" class="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div class="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"><header class="flex items-center justify-between bg-slate-950 p-5 text-white"><div><p class="text-xs font-semibold uppercase tracking-wider text-cyan-300">Comprobante</p><h2 class="font-bold">Venta #{{ selectedSale.id }}</h2></div><button class="text-slate-300 hover:text-white" @click="selectedSale = null">✕</button></header>
      <div class="max-h-[70vh] space-y-4 overflow-y-auto p-5"><div class="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2"><p><span class="text-slate-500">Cliente</span><br><strong>{{ clientName(selectedSale) }}</strong></p><p><span class="text-slate-500">Pago</span><br><strong>{{ selectedSale.metodo_pago }}</strong></p><p><span class="text-slate-500">Fecha</span><br><strong>{{ formatDate(selectedSale.created_at) }}</strong></p><p><span class="text-slate-500">Estado</span><br><strong>{{ selectedSale.estado === 'anulada' ? 'Anulada' : 'Completada' }}</strong></p></div>
      <div class="overflow-x-auto"><table class="w-full min-w-[460px] text-sm"><thead class="border-b text-xs uppercase text-slate-500"><tr><th class="py-2 text-left">Producto</th><th class="py-2 text-center">Cantidad</th><th class="py-2 text-right">Unitario</th><th class="py-2 text-right">Subtotal</th></tr></thead><tbody class="divide-y divide-slate-100"><tr v-for="item in selectedSale.detalles || []" :key="item.id"><td class="py-3"><p class="font-semibold text-slate-800">{{ item.producto?.nombre || item.nombre }}</p><p v-if="item.asignaciones?.length" class="mt-1 text-xs text-slate-500">Lote(s): {{ item.asignaciones.map((assignment) => (assignment.lote?.numero_lote || 'N/D') + ' (' + assignment.cantidad + ')').join(', ') }}</p><p v-else class="mt-1 text-xs text-slate-400">Lote no disponible para venta histórica</p></td><td class="py-3 text-center">{{ item.cantidad }}</td><td class="py-3 text-right">S/ {{ money(item.precio_unitario || item.precio) }}</td><td class="py-3 text-right font-bold">S/ {{ money(Number(item.cantidad) * Number(item.precio_unitario || item.precio)) }}</td></tr></tbody></table></div>
      <div class="flex justify-between rounded-xl bg-cyan-50 p-4"><span class="font-semibold text-slate-700">Total</span><strong class="text-xl text-cyan-800">S/ {{ money(selectedSale.total || localTotal(selectedSale)) }}</strong></div></div>
      <footer class="flex justify-end border-t border-slate-100 p-4"><button class="btn btn-secondary" @click="selectedSale = null">Cerrar</button></footer></div>
    </div>


    <div v-if="saleToReturn" class="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <form class="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" @submit.prevent="saveReturn"><p class="text-xs font-semibold uppercase tracking-wider text-amber-700">Devolución parcial</p><h2 class="mt-1 text-lg font-bold text-slate-900">Venta #{{ saleToReturn.id }}</h2><p class="mt-2 text-sm text-slate-600">El reembolso se registra por {{ saleToReturn.metodo_pago }} y el stock vuelve a los lotes originales.</p><div class="mt-5 space-y-3"><div v-for="item in saleToReturn.detalles || []" :key="item.id" class="rounded-xl border border-slate-200 p-3"><div class="flex justify-between gap-3"><div><p class="font-semibold text-slate-800">{{ item.producto?.nombre || item.nombre }}</p><p class="text-xs text-slate-500">Disponible para devolución: {{ returnableQuantity(item) }} · S/ {{ money(item.precio_unitario || item.precio) }} c/u</p></div><input v-model.number="returnQuantities[item.id]" class="field-control w-20" :max="returnableQuantity(item)" min="0" type="number" /></div></div></div><label class="field-label mt-5">Motivo</label><textarea v-model.trim="returnReason" class="field-control min-h-24" minlength="10" required placeholder="Describe el motivo de la devolución."/><div class="mt-4 flex justify-between rounded-xl bg-amber-50 p-4"><span class="font-semibold text-amber-900">Total a reembolsar</span><strong class="text-lg text-amber-900">S/ {{ money(returnTotal) }}</strong></div><p v-if="returnError" class="mt-2 text-sm text-red-700">{{ returnError }}</p><div class="mt-6 flex justify-end gap-3"><button class="btn btn-secondary" type="button" @click="saleToReturn = null">Cancelar</button><button class="btn !bg-amber-600 !text-white hover:!bg-amber-700" :disabled="returning || returnTotal <= 0">{{ returning ? 'Registrando…' : 'Confirmar devolución' }}</button></div></form>
    </div>
    <div v-if="saleToCancel" class="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <form class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" @submit.prevent="cancelSale"><p class="text-xs font-semibold uppercase tracking-wider text-red-700">Operación administrativa</p><h2 class="mt-1 text-lg font-bold text-slate-900">Anular venta #{{ saleToCancel.id }}</h2><p class="mt-2 text-sm text-slate-600">Se repondrá el stock y la venta quedará marcada como anulada. No se eliminará ningún registro.</p><label class="field-label mt-5">Motivo de anulación</label><textarea v-model.trim="cancellationReason" class="field-control min-h-28" minlength="10" maxlength="1000" required placeholder="Describe el motivo (mínimo 10 caracteres)." /><p v-if="cancelError" class="mt-2 text-sm text-red-700">{{ cancelError }}</p><div class="mt-6 flex justify-end gap-3"><button class="btn btn-secondary" type="button" @click="saleToCancel = null">Volver</button><button class="btn !bg-red-600 !text-white hover:!bg-red-700" :disabled="cancelling"> {{ cancelling ? 'Anulando…' : 'Confirmar anulación' }}</button></div></form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import api from '../api/axios';
import { useAuth } from '../composables/useAuth';
import InlineNotice from '../components/ui/InlineNotice.vue';
import PageHeader from '../components/ui/PageHeader.vue';

const { isAdmin } = useAuth();
const sales = ref([]), loading = ref(false), search = ref(''), from = ref(''), to = ref('');
const pagination = ref({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });
const selectedSale = ref(null), saleToCancel = ref(null), saleToReturn = ref(null), cancellationReason = ref(''), returnReason = ref(''), returnQuantities = ref({}), cancelling = ref(false), returning = ref(false), cancelError = ref(''), returnError = ref(''), notice = ref(null);
const money = (value) => Number(value || 0).toFixed(2);
const formatDate = (value) => value ? new Date(value).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const clientName = (sale) => sale.cliente?.nombre_razon_social || sale.cliente?.nombre || sale.cliente_datos?.nombre_razon_social || 'Cliente eventual';
const clientDocument = (sale) => sale.cliente?.numero_documento || sale.cliente_datos?.numero_documento || '';
const localTotal = (sale) => (sale.detalles || []).reduce((sum, item) => sum + Number(item.cantidad) * Number(item.precio_unitario || item.precio), 0);
const paymentClass = (method) => method === 'Efectivo' ? 'bg-emerald-50 text-emerald-700' : method === 'Yape' ? 'bg-violet-50 text-violet-700' : 'bg-cyan-50 text-cyan-700';
const filteredSales = computed(() => sales.value);
const returnTotal = computed(() => (saleToReturn.value?.detalles || []).reduce((total, item) => total + Number(returnQuantities.value[item.id] || 0) * Number(item.precio_unitario || item.precio || 0), 0));
function show(message, type = 'success') { notice.value = { message, type }; }
async function loadSales(page = 1) {
  loading.value = true;
  try {
    const params = { page, per_page: 15 };
    if (search.value.trim()) params.search = search.value.trim();
    if (from.value) params.fecha_inicio = from.value;
    if (to.value) params.fecha_fin = to.value;
    const { data } = await api.get('/ventas', { params });
    sales.value = Array.isArray(data.data) ? data.data : data;
    pagination.value = {
      currentPage: data.current_page || 1,
      lastPage: data.last_page || 1,
      total: data.total || sales.value.length,
      from: data.from || 0,
      to: data.to || 0,
    };
  } catch {
    show('No se pudo cargar el historial de ventas.', 'error');
  } finally {
    loading.value = false;
  }
}
function openDetail(sale) { selectedSale.value = sale; }
function returnedQuantity(item) { return (item.devoluciones || []).reduce((total, value) => total + Number(value.cantidad || 0), 0); }
function returnableQuantity(item) { return Math.max(0, Number(item.cantidad || 0) - returnedQuantity(item)); }
function canReturn(sale) { return isAdmin.value && sale.estado === 'completada' && (sale.detalles || []).length > 0 && (sale.detalles || []).every((item) => item.asignaciones?.length) && (sale.detalles || []).some((item) => returnableQuantity(item) > 0); }
function openReturn(sale) { saleToReturn.value = sale; returnReason.value = ''; returnError.value = ''; returnQuantities.value = Object.fromEntries((sale.detalles || []).map((item) => [item.id, 0])); }
function openCancel(sale) { saleToCancel.value = sale; cancellationReason.value = ''; cancelError.value = ''; }
async function cancelSale() { cancelling.value = true; cancelError.value = ''; try { await api.post('/ventas/' + saleToCancel.value.id + '/anular', { motivo: cancellationReason.value }); const id = saleToCancel.value.id; saleToCancel.value = null; if (selectedSale.value?.id === id) selectedSale.value = null; show('Venta anulada y stock repuesto. El motivo quedó registrado en la bitácora.'); await loadSales(); } catch (error) { cancelError.value = error.response?.data?.message || 'No se pudo anular la venta.'; } finally { cancelling.value = false; } }
async function saveReturn() { returning.value = true; returnError.value = ''; try { const detalles = Object.entries(returnQuantities.value).filter(([, quantity]) => Number(quantity) > 0).map(([detalle_venta_id, cantidad]) => ({ detalle_venta_id: Number(detalle_venta_id), cantidad: Number(cantidad) })); await api.post('/ventas/' + saleToReturn.value.id + '/devoluciones', { motivo: returnReason.value, detalles }); saleToReturn.value = null; show('Devolución registrada, caja e inventario actualizados.'); await loadSales(); } catch (error) { returnError.value = error.response?.data?.message || 'No se pudo registrar la devolución.'; } finally { returning.value = false; } }
async function downloadTicket(id) { try { const response = await api.get('/ventas/' + id + '/ticket', { responseType: 'blob' }); const url = URL.createObjectURL(new Blob([response.data], { type: 'text/html' })); const link = document.createElement('a'); link.href = url; link.download = 'ticket-venta-' + id + '.html'; link.click(); URL.revokeObjectURL(url); } catch { show('No se pudo descargar el ticket.', 'error'); } }
onMounted(loadSales);
</script>