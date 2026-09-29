<template>
  <div>
    <header class="pos-heading">
      <div>
        <p class="section-kicker">Operación diaria</p>
        <h2 class="page-title">Punto de venta</h2>
      </div>
      <div class="flex items-center gap-2">
        <AppBadge
          :tone="
            catalogError ? 'danger' : loadingProducts ? 'neutral' : 'success'
          "
          >{{
            catalogError
              ? "Catálogo sin conexión"
              : loadingProducts
                ? "Actualizando catálogo"
                : "Catálogo cargado"
          }}</AppBadge
        ><button
          class="icon-button border bg-white"
          :disabled="loadingProducts || processing"
          aria-label="Actualizar catálogo"
          @click="loadProducts"
        >
          <RefreshCw :size="16" :class="{ 'animate-spin': loadingProducts }" />
        </button>
      </div>
    </header>
    <InlineNotice :notice="notice" @dismiss="notice = null" />
    <div class="pos-mobile-tabs" role="group" aria-label="Panel de venta">
      <button
        :aria-pressed="mobilePanel === 'catalog'"
        aria-controls="pos-catalog"
        @click="mobilePanel = 'catalog'"
      >
        Catálogo</button
      ><button
        :aria-pressed="mobilePanel === 'cart'"
        aria-controls="pos-cart"
        @click="mobilePanel = 'cart'"
      >
        Carrito · {{ cart.length }}
      </button>
    </div>
    <div class="pos-workspace">
      <ProductCatalog
        id="pos-catalog"
        :class="{ 'pos-panel-hidden': mobilePanel !== 'catalog' }"
        v-model:query="query"
        :products="filteredProducts"
        :favorite-ids="favoriteIds"
        :recent-products="recentProducts"
        :loading="loadingProducts"
        :error="catalogError"
        :disabled="processing"
        @retry="loadProducts"
        @search="searchProduct"
        @select="addProduct"
        @details="openProductDetails"
        @toggle-favorite="toggleFavorite"
        @focus-search="mobilePanel = 'catalog'"
      />
      <SaleCart
        id="pos-cart"
        :class="{ 'pos-panel-hidden': mobilePanel !== 'cart' }"
        v-model:document-number="documentNumber"
        v-model:payment-method="paymentMethod"
        :cart="cart"
        :customer="customer"
        :processing="processing"
        :total="saleTotal"
        @find-customer="findCustomer"
        @remove="removeFromCart"
        @quantity="updateQuantity"
        @checkout="checkCashRegisterAndSell"
      />
    </div>
    <button
      v-if="cart.length && mobilePanel === 'catalog'"
      class="btn btn-primary pos-mobile-summary"
      @click="mobilePanel = 'cart'"
    >
      <span
        >Ver carrito · {{ cart.length }}
        {{ cart.length === 1 ? "producto" : "productos" }}</span
      ><span>{{ currencySymbol }} {{ saleTotal.toFixed(2) }} →</span>
    </button>
    <p class="sr-only" role="status">{{ selectionMessage }}</p>
    <ProductDetailsDialog
      :open="showProductDetails"
      :product="selectedProductDetails"
      :disabled="processing"
      @close="closeProductDetails"
      @select="addProductFromDetails"
    />
    <PrescriptionDialog
      v-model:data="prescription"
      :open="showPrescription"
      :product="selectedPrescriptionProduct"
      @close="closePrescription"
      @confirm="confirmPrescription"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { RefreshCw } from "lucide-vue-next";
import AppBadge from "../components/ui/AppBadge.vue";
import InlineNotice from "../components/ui/InlineNotice.vue";
import {
  requiresPrescription,
  sellableStock,
} from "../utils/productPresentation";
import { useRouter } from "vue-router";
import api from "../api/axios";
import PrescriptionDialog from "../components/pos/PrescriptionDialog.vue";
import ProductCatalog from "../components/pos/ProductCatalog.vue";
import ProductDetailsDialog from "../components/pos/ProductDetailsDialog.vue";
import SaleCart from "../components/pos/SaleCart.vue";
import { useBusinessConfig } from "../composables/useBusinessConfig";
const { currencySymbol } = useBusinessConfig();

const router = useRouter();
const products = ref([]);
const mobilePanel = ref("catalog");
const catalogError = ref(false);
const selectionMessage = ref("");
const query = ref("");
const documentNumber = ref("");
const customer = ref(null);
const cart = ref([]);
const paymentMethod = ref("Efectivo");
const loadingProducts = ref(false);
const processing = ref(false);
const saleAttemptKey = ref(null);
const notice = ref(null);
const showPrescription = ref(false);
const selectedPrescriptionProduct = ref(null);
const prescription = ref({
  prescriptor_nombre: "",
  prescriptor_colegiatura: "",
  fecha_emision: "",
  tipo: "fisica",
  referencia: "",
  verificada: false,
});
const showProductDetails = ref(false);
const selectedProductDetails = ref(null);
const favoriteIds = ref(readStoredIds("botica-pos-favorite-product-ids"));
const recentIds = ref(readStoredIds("botica-pos-recent-product-ids"));

const filteredProducts = computed(() => {
  const term = query.value.trim().toLowerCase();
  if (!term) return products.value;
  return products.value.filter((product) =>
    [product.nombre, product.codigo_barras, product.principio_activo]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(term)),
  );
});
const recentProducts = computed(() =>
  recentIds.value
    .map((id) => products.value.find((product) => product.id === id))
    .filter(Boolean),
);
const saleTotal = computed(() =>
  cart.value.reduce(
    (total, item) => total + item.cantidad * item.precio_unitario,
    0,
  ),
);

watch(documentNumber, (value) => {
  customer.value = null;
  resetSaleAttempt();
});
watch(paymentMethod, resetSaleAttempt);

function resetSaleAttempt() {
  saleAttemptKey.value = null;
}

function readStoredIds(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
function storeIds(key, ids) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    /* Favorites remain available during this session. */
  }
}
function toggleFavorite(product) {
  const exists = favoriteIds.value.includes(product.id);
  favoriteIds.value = exists
    ? favoriteIds.value.filter((id) => id !== product.id)
    : [product.id, ...favoriteIds.value].slice(0, 12);
  storeIds("botica-pos-favorite-product-ids", favoriteIds.value);
}
function rememberProduct(product) {
  recentIds.value = [
    product.id,
    ...recentIds.value.filter((id) => id !== product.id),
  ].slice(0, 8);
  storeIds("botica-pos-recent-product-ids", recentIds.value);
}
function notify(message, type = "success") {
  notice.value = { message, type };
  window.setTimeout(() => {
    if (notice.value?.message === message) notice.value = null;
  }, 5000);
}
async function loadProducts() {
  loadingProducts.value = true;
  catalogError.value = false;
  try {
    const { data } = await api.get("/productos");
    products.value = data.data || data || [];
  } catch {
    catalogError.value = true;
    notify(
      "No se pudo cargar el catálogo. Puedes reintentar la conexión.",
      "error",
    );
  } finally {
    loadingProducts.value = false;
  }
}
async function searchProduct() {
  if (processing.value) return;
  const term = query.value.trim();
  if (!term) return;

  const exactMatch = products.value.find(
    (product) => product.codigo_barras?.toLowerCase() === term.toLowerCase(),
  );
  if (exactMatch) {
    addProduct(exactMatch);
    query.value = "";
    return;
  }

  if (filteredProducts.value.length === 1) {
    addProduct(filteredProducts.value[0]);
    query.value = "";
    return;
  }

  try {
    const { data } = await api.get(
      "/productos/buscar/" + encodeURIComponent(term),
    );
    const product = data.data || data;
    if (!products.value.some((item) => item.id === product.id))
      products.value.push(product);
    addProduct(product);
    query.value = "";
  } catch {
    notify("No encontramos un producto con ese código.", "error");
  }
}
function openProductDetails(product) {
  selectedProductDetails.value = product;
  showProductDetails.value = true;
}
function closeProductDetails() {
  showProductDetails.value = false;
  selectedProductDetails.value = null;
}
function addProductFromDetails(product) {
  closeProductDetails();
  addProduct(product);
}
function addProduct(product) {
  if (processing.value) return;
  if (sellableStock(product) <= 0)
    return notify(
      "Este producto no tiene unidades vigentes disponibles para vender.",
      "error",
    );
  if (requiresPrescription(product)) {
    selectedPrescriptionProduct.value = product;
    if (!prescription.value.prescriptor_nombre)
      prescription.value = {
        prescriptor_nombre: "",
        prescriptor_colegiatura: "",
        fecha_emision: "",
        tipo: "fisica",
        referencia: "",
        verificada: false,
      };
    showPrescription.value = true;
    return;
  }
  insertIntoCart(product);
}
function confirmPrescription() {
  if (
    !prescription.value.prescriptor_nombre.trim() ||
    !prescription.value.prescriptor_colegiatura.trim() ||
    !prescription.value.fecha_emision ||
    !prescription.value.verificada
  )
    return notify("Completa y confirma la verificación de la receta.", "error");
  insertIntoCart(selectedPrescriptionProduct.value, prescription.value);
  closePrescription();
}
function closePrescription() {
  showPrescription.value = false;
  selectedPrescriptionProduct.value = null;
}
function insertIntoCart(product, recipe = null) {
  resetSaleAttempt();
  rememberProduct(product);
  selectionMessage.value = product.nombre + " agregado al carrito.";
  const existing = cart.value.find((item) => item.producto_id === product.id);
  if (existing) {
    if (existing.cantidad >= existing.stock_max)
      return notify(
        "Alcanzaste el stock disponible para este producto.",
        "error",
      );
    existing.cantidad += 1;
    if (recipe) Object.assign(existing, recipe);
    return;
  }
  cart.value.push({
    producto_id: product.id,
    nombre: product.nombre,
    precio_unitario: Number(product.precio_venta),
    cantidad: 1,
    stock_max: sellableStock(product),
    requiere_receta: requiresPrescription(product),
  });
}
function updateQuantity(item, quantity) {
  if (processing.value) return;
  quantity = Math.floor(quantity);
  resetSaleAttempt();
  if (!Number.isFinite(quantity) || quantity < 1) item.cantidad = 1;
  else if (quantity > item.stock_max) {
    item.cantidad = item.stock_max;
    notify("La cantidad fue ajustada al stock disponible.", "error");
  } else item.cantidad = quantity;
}
function removeFromCart(index) {
  if (processing.value) return;
  resetSaleAttempt();
  cart.value.splice(index, 1);
}
async function findCustomer() {
  if (processing.value) return;
  resetSaleAttempt();
  const document = documentNumber.value.trim();
  if (!document) return;
  try {
    const { data } = await api.get(
      "/clientes/buscar/" + encodeURIComponent(document),
    );
    if (documentNumber.value.trim() !== document || processing.value) return;
    customer.value = data.data || data;
    notify("Cliente encontrado.");
  } catch {
    if (documentNumber.value.trim() !== document || processing.value) return;
    customer.value = null;
    notify("No encontramos un cliente con ese documento.", "error");
  }
}
async function checkCashRegisterAndSell() {
  if (!cart.value.length || processing.value) return;
  processing.value = true;
  try {
    const { data } = await api.get("/caja/estado");
    if (data.estado !== "abierta") {
      notify("Debes abrir caja antes de registrar una venta.", "error");
      processing.value = false;
      await router.push({ name: "caja" });
      return;
    }
  } catch {
    // The API may not expose cash-register status; the sale endpoint remains authoritative.
  }
  await processSale();
}
async function downloadTicket(saleId) {
  try {
    const response = await api.get("/ventas/" + saleId + "/ticket", {
      responseType: "blob",
    });
    const url = URL.createObjectURL(
      new Blob([response.data], { type: "text/html" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "ticket-" + saleId + ".html";
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    notify(
      "La venta fue registrada, pero no se pudo descargar el ticket.",
      "error",
    );
  }
}
async function processSale() {
  processing.value = true;
  try {
    const hasCustomer = Boolean(customer.value && documentNumber.value.trim());
    const hasPrescriptionProduct = cart.value.some(
      (item) => item.requiere_receta,
    );
    if (hasPrescriptionProduct && !hasCustomer)
      return notify(
        "Para dispensar productos con receta, primero identifica al paciente mediante su documento.",
        "error",
      );
    if (hasPrescriptionProduct && !prescription.value.verificada)
      return notify("Debes registrar y verificar la receta médica.", "error");
    const idempotencyKey = saleAttemptKey.value || window.crypto.randomUUID();
    saleAttemptKey.value = idempotencyKey;
    const payload = {
      idempotency_key: idempotencyKey,
      cliente_id: hasCustomer ? customer.value.id : null,
      cliente_datos: hasCustomer
        ? {
            numero_documento: documentNumber.value.trim(),
            nombre_razon_social:
              customer.value.nombre_razon_social || customer.value.nombre,
            tipo_documento:
              documentNumber.value.trim().length === 11 ? "RUC" : "DNI",
          }
        : null,
      metodo_pago: paymentMethod.value,
      receta: hasPrescriptionProduct ? prescription.value : null,
      detalles: cart.value.map((item) => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        nombre_medico: item.nombre_medico,
        cmp_medico: item.cmp_medico,
      })),
    };
    const { data } = await api.post("/ventas", payload);
    const saleId = data.venta_id || data.id || data.data?.id;
    cart.value = [];
    mobilePanel.value = "catalog";
    resetSaleAttempt();
    customer.value = null;
    documentNumber.value = "";
    await loadProducts();
    notify(
      data.idempotent
        ? "La venta ya estaba registrada; se recuperó la operación original."
        : "Venta registrada correctamente.",
    );
    if (saleId) await downloadTicket(saleId);
  } catch (error) {
    notify(
      error.response?.data?.message || "No fue posible registrar la venta.",
      "error",
    );
  } finally {
    processing.value = false;
  }
}
onMounted(loadProducts);
</script>
