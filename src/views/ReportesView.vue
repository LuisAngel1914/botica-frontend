<template>
  <div class="space-y-6">
    <PageHeader
      eyebrow="Vista ejecutiva"
      title="Resumen de tu botica"
      description="El pulso de tus ventas, caja e inventario, en un solo lugar."
    >
      <template #actions
        ><button
          class="btn btn-secondary"
          :disabled="loading"
          @click="loadDashboard"
        >
          <RefreshCw
            :size="15"
            :class="{ 'animate-spin': loading }"
          />Actualizar</button
        ><RouterLink to="/pos" class="btn btn-primary"
          >Nueva venta →</RouterLink
        ></template
      >
    </PageHeader>
    <div
      v-if="error"
      class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
      role="alert"
    >
      {{ error }}
    </div>
    <SkeletonLoader
      v-if="loading"
      class="grid-cols-2 lg:grid-cols-4 !p-0"
      :rows="4"
      label="Cargando indicadores…"
    />
    <template v-else-if="!error">
      <section
        class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Indicadores principales"
      >
        <MetricCard
          v-for="metric in primaryMetrics"
          :key="metric.label"
          :label="metric.label"
          :value="metric.value"
          :detail="metric.detail"
          :icon="metric.icon"
        />
      </section>
      <section class="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <article
          class="overflow-hidden rounded-2xl bg-slate-950 p-6 text-white"
        >
          <div class="flex items-center justify-between">
            <p
              class="text-[10px] font-semibold uppercase tracking-widest text-cyan-300"
            >
              Caja y operación
            </p>
            <AppBadge
              :tone="cashStatus.estado === 'abierta' ? 'success' : 'neutral'"
              >{{
                cashStatus.estado === "abierta"
                  ? "Turno abierto"
                  : "Caja cerrada"
              }}</AppBadge
            >
          </div>
          <div class="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p class="text-xs text-slate-300">
                {{
                  cashStatus.estado === "abierta"
                    ? "Efectivo esperado en caja"
                    : "Prepara el siguiente turno"
                }}
              </p>
              <p class="mt-2 text-3xl font-semibold tracking-tight">
                {{
                  cashStatus.estado === "abierta"
                    ? currencySymbol + " " + money(cashStatus.monto_esperado)
                    : "Todo comienza en caja"
                }}
              </p>
            </div>
            <RouterLink
              to="/caja"
              class="btn border border-white/20 !bg-white/10 text-white hover:!bg-white/20"
              >{{
                cashStatus.estado === "abierta" ? "Ver caja" : "Abrir caja"
              }}
              →</RouterLink
            >
          </div>
          <div
            class="mt-6 grid grid-cols-2 gap-4 border-t border-white/15 pt-4"
          >
            <div>
              <p class="text-[10px] text-slate-400">Fondo inicial</p>
              <p class="mt-1 text-sm font-semibold">
                {{ currencySymbol }} {{ money(cashStatus.monto_inicial) }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400">Devoluciones de hoy</p>
              <p class="mt-1 text-sm font-semibold">
                {{ currencySymbol }} {{ money(dashboard.resumen_caja.devoluciones_hoy) }}
              </p>
            </div>
          </div>
        </article>
        <article class="app-card p-5">
          <p class="section-kicker">Distribución de cobros</p>
          <h2 class="mt-1 text-base font-semibold">Métodos de pago · hoy</h2>
          <div v-if="paymentMethods.length" class="mt-5 space-y-4">
            <div v-for="[method, amount] in paymentMethods" :key="method">
              <div class="mb-1.5 flex justify-between text-xs">
                <span class="text-slate-500">{{ method }}</span
                ><strong class="font-semibold">{{ currencySymbol }} {{ money(amount) }}</strong>
              </div>
              <div class="h-1.5 rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-cyan-600"
                  :style="{ width: paymentWidth(amount) }"
                />
              </div>
            </div>
          </div>
          <EmptyState
            v-else
            icon="card"
            title="Todavía no hay cobros"
            description="La distribución aparecerá con las ventas de hoy."
          />
        </article>
      </section>
      <section
        class="grid gap-5 xl:grid-cols-3"
        aria-label="Prioridades de inventario"
      >
        <article class="app-card overflow-hidden">
          <header class="flex items-center justify-between border-b p-4">
            <h2 class="text-sm font-semibold">Reponer existencias</h2>
            <AppBadge tone="warning">{{
              dashboard.alertas_inventario.total_stock_critico
            }}</AppBadge>
          </header>
          <ul v-if="lowStock.length" class="divide-y">
            <li v-for="product in lowStock" :key="product.id">
              <button
                class="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-slate-50"
                @click="goToInventory(product.id, 'lote')"
              >
                <span class="min-w-0"
                  ><strong class="block truncate text-xs font-semibold">{{
                    product.nombre
                  }}</strong
                  ><span class="text-[10px] text-slate-500"
                    >Mínimo {{ product.stock_minimo }} · Registrar lote</span
                  ></span
                ><AppBadge tone="warning"
                  >{{ product.stock_actual }} un.</AppBadge
                >
              </button>
            </li>
          </ul>
          <EmptyState
            v-else
            icon="package"
            title="Stock bajo control"
            description="No hay productos por debajo del mínimo."
          />
        </article>
        <article class="app-card overflow-hidden">
          <header class="flex items-center justify-between border-b p-4">
            <h2 class="text-sm font-semibold">Retirar lotes vencidos</h2>
            <AppBadge tone="danger">{{
              dashboard.alertas_inventario.total_vencidos
            }}</AppBadge>
          </header>
          <ul v-if="expiredLots.length" class="divide-y">
            <li v-for="lot in expiredLots" :key="lot.id">
              <button
                class="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-red-50"
                @click="goToInventory(lot.producto_id, 'baja', lot.id)"
              >
                <span class="min-w-0"
                  ><strong class="block truncate text-xs font-semibold">{{
                    lot.producto?.nombre || "Producto"
                  }}</strong
                  ><span class="text-[10px] text-slate-500"
                    >Lote {{ lot.numero_lote }} · {{ lot.stock }} un.</span
                  ></span
                ><span class="shrink-0 text-[10px] font-medium text-red-700">{{
                  formatDate(lot.fecha_vencimiento)
                }}</span>
              </button>
            </li>
          </ul>
          <EmptyState
            v-else
            icon="calendar"
            title="Sin existencias vencidas"
            description="No hay lotes pendientes de retirar."
          />
        </article>
        <article class="app-card overflow-hidden">
          <header class="flex items-center justify-between border-b p-4">
            <h2 class="text-sm font-semibold">Priorizar rotación</h2>
            <AppBadge tone="warning">{{
              dashboard.alertas_inventario.total_por_vencer
            }}</AppBadge>
          </header>
          <ul v-if="expiringLots.length" class="divide-y">
            <li v-for="lot in expiringLots" :key="lot.id">
              <button
                class="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-amber-50"
                @click="goToInventory(lot.producto_id)"
              >
                <span class="min-w-0"
                  ><strong class="block truncate text-xs font-semibold">{{
                    lot.producto?.nombre || "Producto"
                  }}</strong
                  ><span class="text-[10px] text-slate-500"
                    >Lote {{ lot.numero_lote }} · {{ lot.stock }} un.</span
                  ></span
                ><span
                  class="shrink-0 text-[10px] font-medium text-amber-800"
                  >{{ formatDate(lot.fecha_vencimiento) }}</span
                >
              </button>
            </li>
          </ul>
          <EmptyState
            v-else
            icon="calendar"
            title="Vencimientos bajo control"
            :description="`Sin lotes que venzan en los próximos ${expiryDays} días.`"
          />
        </article>
      </section>
      <section class="grid gap-5 xl:grid-cols-2">
        <article class="app-card overflow-hidden">
          <header class="border-b p-5">
            <p class="section-kicker">Rendimiento del mes</p>
            <h2 class="mt-1 text-base font-semibold">Productos más vendidos</h2>
          </header>
          <ol v-if="topProducts.length" class="divide-y">
            <li
              v-for="(product, index) in topProducts"
              :key="product.id"
              class="flex items-center gap-3 p-4"
            >
              <span class="w-4 text-xs text-slate-400">{{ index + 1 }}</span
              ><ProductImage
                class="h-11 w-12 shrink-0 rounded-lg"
                :src="product.imagen_url"
                :name="product.nombre"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-xs font-semibold">
                  {{ product.nombre }}
                </p>
                <p class="mt-1 text-[10px] text-slate-500">
                  {{ product.unidades }} unidades netas
                </p>
              </div>
              <strong class="text-xs font-semibold"
                >{{ currencySymbol }} {{ money(product.monto) }}</strong
              >
            </li>
          </ol>
          <EmptyState
            v-else
            icon="trending"
            title="Tus próximas ventas cuentan"
            description="Aquí verás los productos con mayor movimiento."
          />
        </article>
        <article class="app-card overflow-hidden">
          <header class="border-b p-5">
            <p class="section-kicker">Rentabilidad del mes</p>
            <h2 class="mt-1 text-base font-semibold">
              Margen con trazabilidad
            </h2>
          </header>
          <div class="grid grid-cols-2 gap-3 p-4">
            <div class="rounded-lg bg-cyan-50 p-3">
              <p class="text-[10px] text-cyan-800">Margen confirmado</p>
              <p class="mt-1 text-xl font-semibold text-cyan-800">
                {{ currencySymbol }} {{ money(dashboard.rentabilidad?.margen_confirmado) }}
              </p>
              <p class="mt-1 text-[10px] text-cyan-800">
                Costo registrado al vender
              </p>
            </div>
            <div class="rounded-lg bg-amber-50 p-3">
              <p class="text-[10px] text-amber-800">Estimado histórico</p>
              <p class="mt-1 text-xl font-semibold text-amber-900">
                {{ currencySymbol }}
                {{ money(dashboard.rentabilidad?.margen_estimado_historico) }}
              </p>
              <p class="mt-1 text-[10px] text-amber-800">
                Calculado con costo actual
              </p>
            </div>
          </div>
          <div
            v-if="dashboard.productos_rentables?.length"
            class="divide-y border-t"
          >
            <div
              v-for="product in dashboard.productos_rentables"
              :key="product.id"
              class="flex justify-between gap-3 p-4"
            >
              <div class="min-w-0">
                <p class="truncate text-xs font-semibold">
                  {{ product.nombre }}
                </p>
                <p class="mt-1 text-[10px] text-slate-500">
                  {{ product.unidades }} unidades ·
                  {{
                    product.lineas_estimadas
                      ? "Incluye estimaciones"
                      : "Margen confirmado"
                  }}
                </p>
              </div>
              <strong class="shrink-0 text-xs font-semibold"
                >{{ currencySymbol }}
                {{
                  money(
                    Number(product.margen_confirmado) +
                      Number(product.margen_estimado_historico),
                  )
                }}</strong
              >
            </div>
          </div>
        </article>
      </section>
    </template>
    <section class="app-card p-5">
      <div class="mb-4">
        <p class="section-kicker">Reportes</p>
        <h2 class="mt-1 text-base font-semibold">Exporta tus resultados</h2>
        <p class="mt-1 text-xs text-slate-500">
          El rango se aplica a los archivos exportados. Los indicadores muestran
          hoy y el mes actual.
        </p>
      </div>
      <div class="flex flex-wrap items-end gap-3">
        <label
          ><span class="field-label">Desde</span
          ><input
            v-model="reportFrom"
            class="field-control"
            type="date" /></label
        ><label
          ><span class="field-label">Hasta</span
          ><input
            v-model="reportTo"
            class="field-control"
            type="date"
            :min="reportFrom || undefined" /></label
        ><button
          class="btn btn-secondary"
          :disabled="Boolean(exporting)"
          @click="downloadExport('excel')"
        >
          {{ exporting === "excel" ? "Generando…" : "Descargar CSV" }}</button
        ><button
          class="btn btn-secondary"
          :disabled="Boolean(exporting)"
          @click="downloadExport('pdf')"
        >
          {{ exporting === "pdf" ? "Generando…" : "Descargar PDF" }}</button
        ><button class="btn btn-secondary" @click="printReport">
          Imprimir
        </button>
      </div>
    </section>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  AlertTriangle,
  CalendarClock,
  CircleDollarSign,
  CreditCard,
  PackageX,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from "lucide-vue-next";
import api from "../api/axios";
import PageHeader from "../components/ui/PageHeader.vue";
import AppBadge from "../components/ui/AppBadge.vue";
import EmptyState from "../components/ui/EmptyState.vue";
import MetricCard from "../components/ui/MetricCard.vue";
import ProductImage from "../components/ui/ProductImage.vue";
import SkeletonLoader from "../components/ui/SkeletonLoader.vue";
import { useBusinessConfig } from "../composables/useBusinessConfig";

const router = useRouter();
const { expiryDays, currencySymbol } = useBusinessConfig();
const loading = ref(true);
const error = ref("");
const reportFrom = ref("");
const reportTo = ref("");
const exporting = ref("");
const dashboard = ref({
  resumen_caja: {
    ventas_hoy_monto: 0,
    ventas_hoy_cantidad: 0,
    ventas_mes_monto: 0,
    devoluciones_hoy: 0,
    devoluciones_mes: 0,
    total_clientes: 0,
  },
  alertas_inventario: {
    total_stock_critico: 0,
    total_por_vencer: 0,
    total_vencidos: 0,
  },
  estado_caja: {
    estado: "cerrada",
    mensaje: "No hay caja abierta actualmente.",
  },
  productos_stock_critico: [],
  productos_por_vencer: [],
  productos_vencidos: [],
  top_productos: [],
  desglose_pagos: {},
  rentabilidad: {
    margen_confirmado: 0,
    margen_estimado_historico: 0,
    ingresos_confirmados: 0,
    ingresos_estimados_historico: 0,
  },
  productos_rentables: [],
});

const metrics = computed(() => [
  {
    label: "Ventas netas hoy",
    value: currencySymbol.value + " " + money(dashboard.value.resumen_caja.ventas_hoy_monto),
    detail:
      dashboard.value.resumen_caja.ventas_hoy_cantidad +
      " transacciones, menos devoluciones",
    icon: ShoppingBag,
    iconClass: "bg-cyan-100 text-cyan-800",
  },
  {
    label: "Ventas netas del mes",
    value: currencySymbol.value + " " + money(dashboard.value.resumen_caja.ventas_mes_monto),
    detail: "Ventas completadas menos devoluciones",
    icon: TrendingUp,
    iconClass: "bg-emerald-100 text-emerald-800",
  },
  {
    label: "Devoluciones hoy",
    value: currencySymbol.value + " " + money(dashboard.value.resumen_caja.devoluciones_hoy),
    detail: "Reembolsos registrados hoy",
    icon: CreditCard,
    iconClass: "bg-amber-100 text-amber-800",
  },
  {
    label: "Por reabastecer",
    value: dashboard.value.alertas_inventario.total_stock_critico,
    detail: "Productos bajo su mínimo",
    icon: PackageX,
    iconClass: "bg-amber-100 text-amber-800",
  },
  {
    label: "Lotes vencidos",
    value: dashboard.value.alertas_inventario.total_vencidos,
    detail: "Retiro de inventario requerido",
    icon: CalendarClock,
    iconClass: "bg-red-100 text-red-800",
  },
  {
    label: "Caja",
    value:
      dashboard.value.estado_caja?.estado === "abierta" ? "Abierta" : "Cerrada",
    detail:
      dashboard.value.estado_caja?.estado === "abierta"
        ? "Saldo esperado en tiempo real"
        : "Sin operación activa",
    icon: CircleDollarSign,
    iconClass:
      dashboard.value.estado_caja?.estado === "abierta"
        ? "bg-emerald-100 text-emerald-800"
        : "bg-slate-100 text-slate-700",
  },
  {
    label: "Margen confirmado",
    value: currencySymbol.value + " " + money(dashboard.value.rentabilidad?.margen_confirmado),
    detail: "Ventas con costo congelado",
    icon: TrendingUp,
    iconClass: "bg-emerald-100 text-emerald-800",
  },
]);
const topProducts = computed(() => dashboard.value.top_productos || []);
const lowStock = computed(() => dashboard.value.productos_stock_critico || []);
const expiringLots = computed(() => dashboard.value.productos_por_vencer || []);
const expiredLots = computed(() => dashboard.value.productos_vencidos || []);
const cashStatus = computed(
  () =>
    dashboard.value.estado_caja || {
      estado: "cerrada",
      mensaje: "No hay caja abierta actualmente.",
    },
);
const paymentMethods = computed(() =>
  Object.entries(dashboard.value.desglose_pagos || {}),
);
const totalPayments = computed(() =>
  paymentMethods.value.reduce(
    (total, [, amount]) => total + Number(amount || 0),
    0,
  ),
);

const money = (value) => Number(value || 0).toFixed(2);
const formatDate = (value) =>
  new Date(value + "T00:00:00").toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
  });
const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("es-PE", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
const paymentWidth = (amount) =>
  totalPayments.value
    ? Math.max(4, (Number(amount) / totalPayments.value) * 100) + "%"
    : "0%";
const printReport = () => window.print();
const primaryMetrics = computed(() => [
  metrics.value[0],
  metrics.value[1],
  metrics.value[6],
  metrics.value[3],
]);

async function downloadExport(format) {
  exporting.value = format;
  try {
    const params = {};
    if (reportFrom.value) params.fecha_inicio = reportFrom.value;
    if (reportTo.value) params.fecha_fin = reportTo.value;
    const response = await api.get("/reportes/" + format, {
      params,
      responseType: "blob",
    });
    const type = format === "pdf" ? "application/pdf" : "text/csv";
    const url = URL.createObjectURL(new Blob([response.data], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "reporte-ventas-neto." + (format === "pdf" ? "pdf" : "csv");
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    error.value = "No se pudo generar la exportación. Inténtalo nuevamente.";
  } finally {
    exporting.value = "";
  }
}

const goToInventory = (productId, action = "review", lotId = null) =>
  router.push({
    name: "inventario",
    query: { product: productId, action, ...(lotId ? { lote: lotId } : {}) },
  });

async function loadDashboard() {
  loading.value = true;
  error.value = "";
  try {
    const { data } = await api.get("/reportes/dashboard");
    dashboard.value = { ...dashboard.value, ...data };
  } catch {
    error.value =
      "No se pudo cargar el panel. Verifica tu conexión e inténtalo nuevamente.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>
