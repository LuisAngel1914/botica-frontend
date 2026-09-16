<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <PageHeader
      eyebrow="Abastecimiento"
      title="Proveedores y compras"
      description="Registra recepciones por lote para actualizar stock y costos con trazabilidad."
    >
      <template #actions
        ><button class="btn btn-primary" @click="openSupplier()">
          Nuevo proveedor
        </button></template
      >
    </PageHeader>
    <InlineNotice :notice="notice" @dismiss="notice = null" />

    <SkeletonLoader v-if="loading" label="Cargando compras y proveedores…" />
    <section v-else class="app-card p-5 sm:p-6">
      <div
        class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p class="section-kicker">
            Recepción de mercadería
          </p>
          <h2 class="mt-1 text-lg font-bold text-slate-900">
            Registrar compra
          </h2>
        </div>
        <p class="text-sm text-slate-500">
          Total:
          <strong class="text-lg text-slate-900">S/ {{ money(total) }}</strong>
        </p>
      </div>
      <form class="mt-5 space-y-4" @submit.prevent="savePurchase">
        <div class="grid gap-3 sm:grid-cols-2">
          <label
            ><span class="field-label">Proveedor</span
            ><select
              v-model.number="purchase.proveedor_id"
              class="field-control"
              required
            >
              <option :value="null" disabled>Selecciona un proveedor</option>
              <option
                v-for="supplier in suppliers"
                :key="supplier.id"
                :value="supplier.id"
              >
                {{ supplier.nombre }}
              </option>
            </select></label
          ><label
            ><span class="field-label"
              >Documento de compra <em class="font-normal">(opcional)</em></span
            ><input
              v-model.trim="purchase.numero_documento"
              class="field-control"
              placeholder="Factura, boleta o guía"
          /></label>
        </div>
        <div class="space-y-3">
          <PurchaseLine
            v-for="(item, index) in purchase.detalles"
            :key="index"
            v-model="purchase.detalles[index]"
            :index="index"
            :products="products"
            :removable="purchase.detalles.length > 1"
            @remove="purchase.detalles.splice(index, 1)"
          />
        </div>
        <button class="btn btn-secondary" type="button" @click="addItem">
          + Agregar producto
        </button>
        <div class="flex justify-end">
          <button
            class="btn btn-primary"
            :disabled="saving"
          >
            {{ saving ? "Recibiendo…" : "Confirmar recepción" }}
          </button>
        </div>
      </form>
    </section>

    <section class="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
      <article class="app-card overflow-hidden">
        <div class="border-b border-slate-100 p-5">
          <h2 class="font-bold text-slate-900">Proveedores</h2>
          <p class="text-sm text-slate-500">Contactos para tus compras.</p>
        </div>
        <div v-if="suppliers.length" class="divide-y divide-slate-100">
          <div
            v-for="supplier in suppliers"
            :key="supplier.id"
            class="flex items-center justify-between gap-3 p-4"
          >
            <div class="min-w-0">
              <p class="truncate font-bold text-slate-800">
                {{ supplier.nombre }}
              </p>
              <p class="text-xs text-slate-500">
                {{ supplier.ruc || "Sin RUC" }} ·
                {{ supplier.telefono || "Sin teléfono" }}
              </p>
            </div>
            <button
              class="btn btn-secondary !px-3 !py-2 text-xs"
              @click="openSupplier(supplier)"
            >
              Editar
            </button>
          </div>
        </div>
        <div v-else class="p-6 text-sm text-slate-500">
          Registra tu primer proveedor.
        </div>
      </article>
      <article class="app-card overflow-hidden">
        <div class="border-b border-slate-100 p-5">
          <h2 class="font-bold text-slate-900">Compras recientes</h2>
          <p class="text-sm text-slate-500">
            Recepciones que ya impactaron el inventario.
          </p>
          <input
            v-model="receiptSearch"
            class="field-control mt-3"
            placeholder="Proveedor o documento"
            aria-label="Buscar entre compras cargadas"
          />
        </div>
        <div v-if="filteredReceipts.length" class="divide-y divide-slate-100">
          <div
            v-for="receipt in filteredReceipts"
            :key="receipt.id"
            class="flex items-center justify-between gap-3 p-4"
          >
            <div>
              <p class="font-bold text-slate-800">
                Compra #{{ receipt.id }} · {{ receipt.proveedor?.nombre }}
              </p>
              <p class="text-xs text-slate-500">
                {{ formatDate(receipt.fecha_recepcion)
                }}<span v-if="receipt.numero_documento">
                  · {{ receipt.numero_documento }}</span
                >
              </p>
            </div>
            <div class="shrink-0 text-right">
              <strong class="block text-sm text-cyan-700"
                >S/ {{ money(receipt.total) }}</strong
              ><button
                class="mt-2 text-xs font-semibold text-cyan-700 underline underline-offset-4"
                @click="selectedReceipt = receipt"
              >
                Ver detalle
              </button>
            </div>
          </div>
        </div>
        <EmptyState
          v-else
          title="Sin compras para mostrar"
          description="Registra una recepción o revisa tu búsqueda."
        />
      </article>
    </section>

    <AppDialog
      :open="Boolean(selectedReceipt)"
      label="Detalle de compra"
      @close="selectedReceipt = null"
      ><section v-if="selectedReceipt" class="w-[640px] max-w-full bg-white">
        <header class="flex items-start justify-between gap-3 border-b p-5">
          <div>
            <p class="section-kicker">Recepción registrada</p>
            <h2 class="mt-1 text-lg font-semibold">
              Compra #{{ selectedReceipt.id }}
            </h2>
            <p class="mt-2 text-xs text-slate-500">
              {{ selectedReceipt.proveedor?.nombre }} ·
              {{ formatDate(selectedReceipt.fecha_recepcion) }}
            </p>
            <p class="mt-1 text-xs text-slate-500">
              Responsable: {{ selectedReceipt.user?.name || "No disponible" }}
            </p>
          </div>
          <button class="btn btn-secondary" @click="selectedReceipt = null">
            Cerrar
          </button>
        </header>
        <DataTable label="Productos recibidos"
          ><thead>
            <tr>
              <th scope="col" class="p-4">Producto / lote</th>
              <th scope="col" class="p-4">Cantidad</th>
              <th scope="col" class="p-4">Costo unitario</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in selectedReceipt.detalles || []" :key="item.id">
              <td class="p-4">
                <strong class="text-xs">{{ item.producto?.nombre }}</strong>
                <p class="mt-1 text-xs text-slate-500">
                  {{ item.numero_lote || "Lote registrado en inventario" }}
                </p>
              </td>
              <td class="p-4">{{ item.cantidad }}</td>
              <td class="p-4">S/ {{ money(item.costo_unitario) }}</td>
            </tr>
          </tbody></DataTable
        >
        <p class="p-5 text-right text-lg font-semibold">
          Total S/ {{ money(selectedReceipt.total) }}
        </p>
      </section></AppDialog
    >
    <AppDialog
      v-if="supplierModal"
      :open="true"
      label="Datos del proveedor"
      :busy="saving"
      :error="notice?.type === 'error' ? notice.message : ''"
      @close="supplierModal = false"
      ><form
        class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        @submit.prevent="saveSupplier"
      >
        <h2 class="text-lg font-bold text-slate-900">
          {{ supplierForm.id ? "Editar proveedor" : "Nuevo proveedor" }}
        </h2>
        <div class="mt-5 grid gap-4 sm:grid-cols-2">
          <label class="sm:col-span-2"
            ><span class="field-label">Razón social o nombre</span
            ><input
              v-model.trim="supplierForm.nombre"
              class="field-control"
              required /></label
          ><label
            ><span class="field-label"
              >RUC <em class="font-normal">(opcional)</em></span
            ><input
              v-model.trim="supplierForm.ruc"
              class="field-control" /></label
          ><label
            ><span class="field-label">Contacto</span
            ><input
              v-model.trim="supplierForm.contacto"
              class="field-control" /></label
          ><label
            ><span class="field-label">Teléfono</span
            ><input
              v-model.trim="supplierForm.telefono"
              class="field-control" /></label
          ><label
            ><span class="field-label">Correo</span
            ><input
              v-model.trim="supplierForm.email"
              class="field-control"
              type="email" /></label
          ><label class="sm:col-span-2"
            ><span class="field-label">Dirección</span
            ><input v-model.trim="supplierForm.direccion" class="field-control"
          /></label>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button
            class="btn btn-secondary"
            type="button"
            @click="supplierModal = false"
          >
            Cancelar</button
          ><button class="btn btn-primary" :disabled="saving">
            {{ saving ? "Guardando…" : "Guardar proveedor" }}
          </button>
        </div>
      </form></AppDialog
    >
  </div>
</template>
<script setup>
import AppDialog from "../components/ui/AppDialog.vue";
import DataTable from "../components/ui/DataTable.vue";
import PurchaseLine from "../components/PurchaseLine.vue";
import { computed, onMounted, ref } from "vue";
import api from "../api/axios";
import InlineNotice from "../components/ui/InlineNotice.vue";
import PageHeader from "../components/ui/PageHeader.vue";
import EmptyState from "../components/ui/EmptyState.vue";
import SkeletonLoader from "../components/ui/SkeletonLoader.vue";
const suppliers = ref([]),
  products = ref([]),
  purchases = ref([]),
  saving = ref(false),
  notice = ref(null),
  supplierModal = ref(false);
const loading = ref(true),
  selectedReceipt = ref(null),
  receiptSearch = ref("");
const filteredReceipts = computed(() =>
  purchases.value.filter((receipt) =>
    [receipt.id, receipt.proveedor?.nombre, receipt.numero_documento].some(
      (value) =>
        String(value || "")
          .toLowerCase()
          .includes(receiptSearch.value.toLowerCase()),
    ),
  ),
);
const emptySupplier = () => ({
  id: null,
  nombre: "",
  ruc: "",
  contacto: "",
  telefono: "",
  email: "",
  direccion: "",
});
const supplierForm = ref(emptySupplier());
const emptyItem = () => ({
  producto_id: null,
  numero_lote: "",
  cantidad: 1,
  costo_unitario: 0,
  fecha_vencimiento: "",
});
const purchase = ref({
  proveedor_id: null,
  numero_documento: "",
  detalles: [emptyItem()],
});
const total = computed(() =>
  purchase.value.detalles.reduce(
    (sum, item) =>
      sum + Number(item.cantidad || 0) * Number(item.costo_unitario || 0),
    0,
  ),
);
const money = (value) => Number(value || 0).toFixed(2);
const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
function show(message, type = "success") {
  notice.value = { message, type };
}
async function loadData() {
  loading.value = true;
  try {
    const [supplierResponse, productResponse, purchaseResponse] =
      await Promise.all([
        api.get("/proveedores"),
        api.get("/productos"),
        api.get("/compras"),
      ]);
    suppliers.value = supplierResponse.data.data || [];
    products.value = productResponse.data.data || productResponse.data || [];
    purchases.value = purchaseResponse.data.data || [];
  } catch {
    show("No se pudo cargar la información de compras.", "error");
  } finally {
    loading.value = false;
  }
}
function openSupplier(supplier = null) {
  supplierForm.value = supplier
    ? { ...emptySupplier(), ...supplier }
    : emptySupplier();
  supplierModal.value = true;
}
function addItem() {
  purchase.value.detalles.push(emptyItem());
}
async function saveSupplier() {
  saving.value = true;
  try {
    const payload = {
      ...supplierForm.value,
      ruc: supplierForm.value.ruc || null,
      contacto: supplierForm.value.contacto || null,
      telefono: supplierForm.value.telefono || null,
      email: supplierForm.value.email || null,
      direccion: supplierForm.value.direccion || null,
    };
    if (supplierForm.value.id)
      await api.put("/proveedores/" + supplierForm.value.id, payload);
    else await api.post("/proveedores", payload);
    supplierModal.value = false;
    show("Proveedor guardado.");
    await loadData();
  } catch (error) {
    show(
      error.response?.data?.message || "No se pudo guardar el proveedor.",
      "error",
    );
  } finally {
    saving.value = false;
  }
}
async function savePurchase() {
  saving.value = true;
  try {
    await api.post("/compras", {
      ...purchase.value,
      detalles: purchase.value.detalles.map((item) => ({
        ...item,
        cantidad: Number(item.cantidad),
        costo_unitario: Number(item.costo_unitario),
      })),
    });
    purchase.value = {
      proveedor_id: null,
      numero_documento: "",
      detalles: [emptyItem()],
    };
    show("Compra recibida: stock y costos actualizados.");
    await loadData();
  } catch (error) {
    show(
      error.response?.data?.message || "No se pudo registrar la compra.",
      "error",
    );
  } finally {
    saving.value = false;
  }
}
onMounted(loadData);
</script>
