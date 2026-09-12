<template>
  <div class="space-y-6">
    <PageHeader eyebrow="Inteligencia comercial" title="Panel de negocio" description="Ventas, abastecimiento y alertas prioritarias en un solo lugar.">
      <template #actions>
        <button class="btn btn-secondary" :disabled="loading" @click="loadDashboard"><RefreshCw :size="16" :class="{ 'animate-spin': loading }" />{{ loading ? 'Actualizando…' : 'Actualizar' }}</button>
        <button class="btn bg-slate-950 text-white hover:bg-slate-800" @click="printReport">Imprimir resumen</button>
      </template>
    </PageHeader>

    <div v-if="error" class="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert"><AlertTriangle :size="20" /><span>{{ error }}</span></div>

    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article v-for="metric in metrics" :key="metric.label" class="app-card p-5">
        <div class="flex items-start justify-between gap-3">
          <div><p class="text-xs font-semibold uppercase tracking-wider text-slate-500">{{ metric.label }}</p><p class="mt-2 text-2xl font-black tracking-tight text-slate-900">{{ metric.value }}</p><p class="mt-1 text-xs text-slate-500">{{ metric.detail }}</p></div>
          <span class="grid h-10 w-10 place-items-center rounded-xl" :class="metric.iconClass"><component :is="metric.icon" :size="20" /></span>
        </div>
      </article>
    </section>

    <section class="app-card overflow-hidden">
      <div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between" :class="cashStatus.estado === 'abierta' ? 'border-l-4 border-emerald-500' : 'border-l-4 border-slate-300'">
        <div><p class="text-xs font-semibold uppercase tracking-wider" :class="cashStatus.estado === 'abierta' ? 'text-emerald-700' : 'text-slate-500'">Control de caja</p><h2 class="mt-1 text-lg font-bold text-slate-900">{{ cashStatus.estado === 'abierta' ? 'Caja abierta' : 'Caja cerrada' }}</h2><p class="mt-1 text-sm text-slate-500">{{ cashStatus.estado === 'abierta' ? 'Responsable: ' + cashStatus.responsable + ' · Desde ' + formatDateTime(cashStatus.fecha_apertura) : cashStatus.mensaje }}</p></div>
        <div v-if="cashStatus.estado === 'abierta'" class="grid grid-cols-2 gap-3 sm:min-w-80"><div class="rounded-xl bg-slate-50 p-3"><p class="text-xs text-slate-500">Ventas efectivo</p><strong class="text-slate-900">S/ {{ money(cashStatus.ventas_efectivo) }}</strong></div><div class="rounded-xl bg-emerald-50 p-3"><p class="text-xs text-emerald-700">Saldo esperado</p><strong class="text-emerald-900">S/ {{ money(cashStatus.monto_esperado) }}</strong></div></div>
      </div>
    </section>

    <section class="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <article class="app-card p-5"><p class="text-xs font-semibold uppercase tracking-wider text-emerald-700">Rentabilidad del mes</p><h2 class="mt-1 text-lg font-bold text-slate-900">Margen con trazabilidad</h2><div class="mt-5 grid gap-3 sm:grid-cols-2"><div class="rounded-xl bg-emerald-50 p-4"><p class="text-xs font-semibold text-emerald-800">Confirmado</p><p class="mt-1 text-2xl font-black text-emerald-900">S/ {{ money(dashboard.rentabilidad?.margen_confirmado) }}</p><p class="mt-1 text-xs text-emerald-700">Costo capturado al vender.</p></div><div class="rounded-xl bg-amber-50 p-4"><p class="text-xs font-semibold text-amber-800">Estimado histórico</p><p class="mt-1 text-2xl font-black text-amber-900">S/ {{ money(dashboard.rentabilidad?.margen_estimado_historico) }}</p><p class="mt-1 text-xs text-amber-700">Usa costo actual para ventas antiguas.</p></div></div></article>
      <article class="app-card overflow-hidden"><div class="border-b border-slate-100 p-5"><p class="text-xs font-semibold uppercase tracking-wider text-emerald-700">Rentabilidad</p><h2 class="mt-1 text-lg font-bold text-slate-900">Productos con mejor margen</h2></div><div v-if="dashboard.productos_rentables?.length" class="divide-y divide-slate-100"><div v-for="product in dashboard.productos_rentables" :key="product.id" class="flex items-center justify-between gap-3 p-4"><div class="min-w-0"><p class="truncate font-bold text-slate-800">{{ product.nombre }}</p><p class="text-xs text-slate-500">{{ product.unidades }} un. · {{ product.lineas_estimadas ? 'Incluye histórico estimado' : 'Margen confirmado' }}</p></div><strong class="shrink-0 text-emerald-700">S/ {{ money(Number(product.margen_confirmado) + Number(product.margen_estimado_historico)) }}</strong></div></div><EmptyState v-else icon="trending" title="Aún no hay margen calculable" description="Las próximas ventas registrarán su costo unitario." /></article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
      <article class="app-card overflow-hidden">
        <div class="flex items-center justify-between border-b border-slate-100 p-5"><div><p class="text-xs font-semibold uppercase tracking-wider text-cyan-700">Rendimiento</p><h2 class="mt-1 text-lg font-bold text-slate-900">Productos más vendidos del mes</h2></div><TrendingUp class="text-cyan-700" :size="22" /></div>
        <div v-if="loading" class="grid min-h-52 place-items-center text-sm text-slate-500">Cargando indicadores…</div>
        <ol v-else-if="topProducts.length" class="divide-y divide-slate-100">
          <li v-for="(product, index) in topProducts" :key="product.id" class="flex items-center gap-3 p-4 sm:p-5">
            <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-600">{{ index + 1 }}</span>
            <div class="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-cyan-50 text-xs font-bold text-cyan-700">
              <img v-if="product.imagen_url" :src="product.imagen_url" :alt="product.nombre" class="h-full w-full object-cover" @error="$event.target.remove()" />
              <span v-else>{{ initials(product.nombre) }}</span>
            </div>
            <div class="min-w-0 flex-1"><p class="truncate text-sm font-bold text-slate-800">{{ product.nombre }}</p><p class="mt-0.5 text-xs text-slate-500">{{ product.unidades }} unidades vendidas</p></div>
            <p class="shrink-0 text-sm font-black text-cyan-700">S/ {{ money(product.monto) }}</p>
          </li>
        </ol>
        <EmptyState v-else icon="trending" title="Aún no hay ventas este mes" description="Los productos vendidos aparecerán aquí." />
      </article>

      <article class="app-card overflow-hidden">
        <div class="border-b border-slate-100 p-5"><p class="text-xs font-semibold uppercase tracking-wider text-cyan-700">Cobros de hoy</p><h2 class="mt-1 text-lg font-bold text-slate-900">Métodos de pago</h2></div>
        <div v-if="paymentMethods.length" class="space-y-4 p-5">
          <div v-for="[method, amount] in paymentMethods" :key="method"><div class="mb-1.5 flex justify-between gap-3 text-sm"><span class="font-medium text-slate-700">{{ method }}</span><span class="font-bold text-slate-900">S/ {{ money(amount) }}</span></div><div class="h-2 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full bg-cyan-500" :style="{ width: paymentWidth(amount) }"></div></div></div>
        </div>
        <EmptyState v-else icon="card" title="Sin cobros hoy" description="La distribución aparecerá al registrar ventas." />
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-3">
      <article class="app-card overflow-hidden">
        <div class="flex items-center justify-between border-b border-slate-100 p-5"><div><p class="text-xs font-semibold uppercase tracking-wider text-amber-700">Atención requerida</p><h2 class="mt-1 text-lg font-bold text-slate-900">Stock crítico</h2></div><span class="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">{{ dashboard.alertas_inventario.total_stock_critico }}</span></div>
        <ul v-if="lowStock.length" class="divide-y divide-slate-100"><li v-for="product in lowStock" :key="product.id" class="flex items-center justify-between gap-3 p-4"><div class="min-w-0"><p class="truncate text-sm font-bold text-slate-800">{{ product.nombre }}</p><p class="mt-0.5 text-xs text-slate-500">Mínimo recomendado: {{ product.stock_minimo }}</p></div><span class="rounded-lg bg-amber-50 px-2.5 py-1 text-sm font-black text-amber-800">{{ product.stock_actual }} un.</span></li></ul>
        <EmptyState v-else icon="package" title="Stock saludable" description="No hay productos por debajo del mínimo." />
      </article>

      <article class="app-card overflow-hidden">
        <div class="flex items-center justify-between border-b border-slate-100 p-5"><div><p class="text-xs font-semibold uppercase tracking-wider text-red-700">Acción inmediata</p><h2 class="mt-1 text-lg font-bold text-slate-900">Lotes vencidos</h2></div><span class="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800">{{ dashboard.alertas_inventario.total_vencidos }}</span></div>
        <ul v-if="expiredLots.length" class="divide-y divide-slate-100"><li v-for="lot in expiredLots" :key="lot.id" class="flex items-center justify-between gap-3 p-4"><div class="min-w-0"><p class="truncate text-sm font-bold text-slate-800">{{ lot.producto?.nombre || 'Producto' }}</p><p class="mt-0.5 text-xs text-slate-500">Lote {{ lot.numero_lote }} · {{ lot.stock }} un.</p></div><span class="shrink-0 text-xs font-bold text-red-700">Venció {{ formatDate(lot.fecha_vencimiento) }}</span></li></ul>
        <EmptyState v-else icon="calendar" title="Sin lotes vencidos" description="No hay existencias vencidas para retirar." />
      </article>

      <article class="app-card overflow-hidden">
        <div class="flex items-center justify-between border-b border-slate-100 p-5"><div><p class="text-xs font-semibold uppercase tracking-wider text-amber-700">Prevención</p><h2 class="mt-1 text-lg font-bold text-slate-900">Próximos vencimientos</h2></div><span class="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">{{ dashboard.alertas_inventario.total_por_vencer }}</span></div>
        <ul v-if="expiringLots.length" class="divide-y divide-slate-100"><li v-for="lot in expiringLots" :key="lot.id" class="flex items-center justify-between gap-3 p-4"><div class="min-w-0"><p class="truncate text-sm font-bold text-slate-800">{{ lot.producto?.nombre || 'Producto' }}</p><p class="mt-0.5 text-xs text-slate-500">Lote {{ lot.numero_lote }} · {{ lot.stock }} un.</p></div><span class="shrink-0 text-xs font-bold text-red-700">{{ formatDate(lot.fecha_vencimiento) }}</span></li></ul>
        <EmptyState v-else icon="calendar" title="Sin vencimientos próximos" description="No hay lotes que venzan en los próximos 60 días." />
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, ref } from 'vue';
import { AlertTriangle, CalendarClock, CircleDollarSign, CreditCard, PackageX, RefreshCw, ShoppingBag, TrendingUp } from 'lucide-vue-next';
import api from '../api/axios';
import PageHeader from '../components/ui/PageHeader.vue';

const loading = ref(false);
const error = ref('');
const dashboard = ref({
  resumen_caja: { ventas_hoy_monto: 0, ventas_hoy_cantidad: 0, ventas_mes_monto: 0, total_clientes: 0 },
  alertas_inventario: { total_stock_critico: 0, total_por_vencer: 0, total_vencidos: 0 },
  estado_caja: { estado: 'cerrada', mensaje: 'No hay caja abierta actualmente.' },
  productos_stock_critico: [],
  productos_por_vencer: [],
  productos_vencidos: [],
  top_productos: [],
  desglose_pagos: {},
  rentabilidad: { margen_confirmado: 0, margen_estimado_historico: 0, ingresos_confirmados: 0, ingresos_estimados_historico: 0 },
  productos_rentables: [],
});

const metrics = computed(() => [
  { label: 'Ventas hoy', value: 'S/ ' + money(dashboard.value.resumen_caja.ventas_hoy_monto), detail: dashboard.value.resumen_caja.ventas_hoy_cantidad + ' transacciones', icon: ShoppingBag, iconClass: 'bg-cyan-100 text-cyan-800' },
  { label: 'Ventas del mes', value: 'S/ ' + money(dashboard.value.resumen_caja.ventas_mes_monto), detail: 'Solo ventas completadas', icon: TrendingUp, iconClass: 'bg-emerald-100 text-emerald-800' },
  { label: 'Por reabastecer', value: dashboard.value.alertas_inventario.total_stock_critico, detail: 'Productos bajo su mínimo', icon: PackageX, iconClass: 'bg-amber-100 text-amber-800' },
  { label: 'Lotes vencidos', value: dashboard.value.alertas_inventario.total_vencidos, detail: 'Retiro de inventario requerido', icon: CalendarClock, iconClass: 'bg-red-100 text-red-800' },
  { label: 'Caja', value: dashboard.value.estado_caja?.estado === 'abierta' ? 'Abierta' : 'Cerrada', detail: dashboard.value.estado_caja?.estado === 'abierta' ? 'Saldo esperado en tiempo real' : 'Sin operación activa', icon: CircleDollarSign, iconClass: dashboard.value.estado_caja?.estado === 'abierta' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700' },
  { label: 'Margen confirmado', value: 'S/ ' + money(dashboard.value.rentabilidad?.margen_confirmado), detail: 'Ventas con costo congelado', icon: TrendingUp, iconClass: 'bg-emerald-100 text-emerald-800' },
]);
const topProducts = computed(() => dashboard.value.top_productos || []);
const lowStock = computed(() => dashboard.value.productos_stock_critico || []);
const expiringLots = computed(() => dashboard.value.productos_por_vencer || []);
const expiredLots = computed(() => dashboard.value.productos_vencidos || []);
const cashStatus = computed(() => dashboard.value.estado_caja || { estado: 'cerrada', mensaje: 'No hay caja abierta actualmente.' });
const paymentMethods = computed(() => Object.entries(dashboard.value.desglose_pagos || {}));
const totalPayments = computed(() => paymentMethods.value.reduce((total, [, amount]) => total + Number(amount || 0), 0));

const EmptyState = defineComponent({
  props: { icon: String, title: String, description: String },
  setup(props) {
    const icons = { trending: TrendingUp, card: CreditCard, package: PackageX, calendar: CalendarClock };
    return () => h('div', { class: 'grid min-h-44 place-items-center p-6 text-center' }, [h(icons[props.icon] || AlertTriangle, { size: 28, class: 'mb-2 text-slate-300' }), h('div', [h('p', { class: 'font-semibold text-slate-700' }, props.title), h('p', { class: 'mt-1 text-sm text-slate-500' }, props.description)])]);
  },
});

const money = (value) => Number(value || 0).toFixed(2);
const initials = (name = '') => name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase() || 'RX';
const formatDate = (value) => new Date(value + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
const formatDateTime = (value) => value ? new Date(value).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
const paymentWidth = (amount) => totalPayments.value ? Math.max(4, (Number(amount) / totalPayments.value) * 100) + '%' : '0%';
const printReport = () => window.print();

async function loadDashboard() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await api.get('/reportes/dashboard');
    dashboard.value = { ...dashboard.value, ...data };
  } catch {
    error.value = 'No se pudo cargar el panel. Verifica tu conexión e inténtalo nuevamente.';
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<style>
@media print {
  aside, header, button { display: none !important; }
  main { padding-left: 0 !important; }
  .app-card { box-shadow: none !important; break-inside: avoid; }
}
</style>