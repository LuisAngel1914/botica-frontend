<template>
  <div class="space-y-4">
    <div v-if="notice" class="flex items-start justify-between gap-3 rounded-2xl border p-4 text-sm" :class="notice.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'" role="status"><span>{{ notice.message }}</span><button class="rounded-lg px-2 py-1 font-bold hover:bg-black/5" aria-label="Cerrar aviso" @click="notice = null">×</button></div>
    <div class="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.8fr)]">
      <ProductCatalog v-model:query="query" :products="filteredProducts" :favorite-ids="favoriteIds" :recent-products="recentProducts" :loading="loadingProducts" @search="searchProduct" @select="addProduct" @details="openProductDetails" @toggle-favorite="toggleFavorite" />
      <SaleCart v-model:document-number="documentNumber" v-model:payment-method="paymentMethod" :cart="cart" :customer="customer" :processing="processing" :total="saleTotal" @find-customer="findCustomer" @remove="removeFromCart" @quantity="updateQuantity" @checkout="checkCashRegisterAndSell" />
    </div>
    <ProductDetailsDialog :open="showProductDetails" :product="selectedProductDetails" @close="closeProductDetails" @select="addProductFromDetails" />
    <PrescriptionDialog v-model:data="prescription" :open="showPrescription" :product="selectedPrescriptionProduct" @close="closePrescription" @confirm="confirmPrescription" />
    <ChatIaModal />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api/axios';
import ChatIaModal from '../components/ChatIaModal.vue';
import PrescriptionDialog from '../components/pos/PrescriptionDialog.vue';
import ProductCatalog from '../components/pos/ProductCatalog.vue';
import ProductDetailsDialog from '../components/pos/ProductDetailsDialog.vue';
import SaleCart from '../components/pos/SaleCart.vue';

const router = useRouter();
const products = ref([]);
const query = ref('');
const documentNumber = ref('');
const customer = ref(null);
const cart = ref([]);
const paymentMethod = ref('Efectivo');
const loadingProducts = ref(false);
const processing = ref(false);
const notice = ref(null);
const showPrescription = ref(false);
const selectedPrescriptionProduct = ref(null);
const prescription = ref({ nombre_medico: '', cmp_medico: '' });
const showProductDetails = ref(false);
const selectedProductDetails = ref(null);
const favoriteIds = ref(readStoredIds('botica-pos-favorite-product-ids'));
const recentIds = ref(readStoredIds('botica-pos-recent-product-ids'));

const filteredProducts = computed(() => {
  const term = query.value.trim().toLowerCase();
  if (!term) return products.value;
  return products.value.filter((product) => product.nombre?.toLowerCase().includes(term) || product.codigo_barras?.toLowerCase().includes(term));
});
const recentProducts = computed(() => recentIds.value.map((id) => products.value.find((product) => product.id === id)).filter(Boolean));
const saleTotal = computed(() => cart.value.reduce((total, item) => total + item.cantidad * item.precio_unitario, 0));

watch(documentNumber, (value) => { if (!value?.trim()) customer.value = null; });

function readStoredIds(key) { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } }
function storeIds(key, ids) { localStorage.setItem(key, JSON.stringify(ids)); }
function toggleFavorite(product) { const exists = favoriteIds.value.includes(product.id); favoriteIds.value = exists ? favoriteIds.value.filter((id) => id !== product.id) : [product.id, ...favoriteIds.value].slice(0, 12); storeIds('botica-pos-favorite-product-ids', favoriteIds.value); }
function rememberProduct(product) { recentIds.value = [product.id, ...recentIds.value.filter((id) => id !== product.id)].slice(0, 8); storeIds('botica-pos-recent-product-ids', recentIds.value); }
function notify(message, type = 'success') {
  notice.value = { message, type };
  window.setTimeout(() => { if (notice.value?.message === message) notice.value = null; }, 5000);
}
async function loadProducts() {
  loadingProducts.value = true;
  try {
    const { data } = await api.get('/productos');
    products.value = data.data || data || [];
  } catch {
    notify('No se pudo cargar el catálogo. Intenta actualizar la página.', 'error');
  } finally {
    loadingProducts.value = false;
  }
}
function searchProduct() {
  if (filteredProducts.value.length === 1) {
    addProduct(filteredProducts.value[0]);
    query.value = '';
  }
}
function openProductDetails(product) { selectedProductDetails.value = product; showProductDetails.value = true; }
function closeProductDetails() { showProductDetails.value = false; selectedProductDetails.value = null; }
function addProductFromDetails(product) { closeProductDetails(); addProduct(product); }
function addProduct(product) {
  if (Number(product.stock_actual) <= 0) return notify('Este producto no tiene stock disponible.', 'error');
  if (product.requiere_receta) {
    selectedPrescriptionProduct.value = product;
    prescription.value = { nombre_medico: '', cmp_medico: '' };
    showPrescription.value = true;
    return;
  }
  insertIntoCart(product);
}
function confirmPrescription() {
  if (!prescription.value.nombre_medico.trim() || !prescription.value.cmp_medico.trim()) {
    return notify('Completa el nombre y la colegiatura del médico.', 'error');
  }
  insertIntoCart(selectedPrescriptionProduct.value, prescription.value);
  closePrescription();
}
function closePrescription() {
  showPrescription.value = false;
  selectedPrescriptionProduct.value = null;
}
function insertIntoCart(product, recipe = null) {
  rememberProduct(product);
  const existing = cart.value.find((item) => item.producto_id === product.id);
  if (existing) {
    if (existing.cantidad >= existing.stock_max) return notify('Alcanzaste el stock disponible para este producto.', 'error');
    existing.cantidad += 1;
    if (recipe) Object.assign(existing, recipe);
    return;
  }
  cart.value.push({
    producto_id: product.id, nombre: product.nombre, precio_unitario: Number(product.precio_venta),
    cantidad: 1, stock_max: Number(product.stock_actual), requiere_receta: Boolean(product.requiere_receta),
    nombre_medico: recipe?.nombre_medico || null, cmp_medico: recipe?.cmp_medico || null,
  });
}
function updateQuantity(item, quantity) {
  if (!Number.isFinite(quantity) || quantity < 1) item.cantidad = 1;
  else if (quantity > item.stock_max) {
    item.cantidad = item.stock_max;
    notify('La cantidad fue ajustada al stock disponible.', 'error');
  } else item.cantidad = quantity;
}
function removeFromCart(index) { cart.value.splice(index, 1); }
async function findCustomer() {
  const document = documentNumber.value.trim();
  if (!document) return;
  try {
    const { data } = await api.get('/clientes/buscar/' + encodeURIComponent(document));
    customer.value = data.data || data;
    notify('Cliente encontrado.');
  } catch {
    customer.value = null;
    notify('No encontramos un cliente con ese documento.', 'error');
  }
}
async function checkCashRegisterAndSell() {
  if (!cart.value.length || processing.value) return;
  try {
    const { data } = await api.get('/caja/estado');
    if (data.estado !== 'abierta') {
      notify('Debes abrir caja antes de registrar una venta.', 'error');
      await router.push({ name: 'caja' });
      return;
    }
  } catch {
    // The API may not expose cash-register status; the sale endpoint remains authoritative.
  }
  await processSale();
}
async function processSale() {
  processing.value = true;
  try {
    const hasCustomer = Boolean(customer.value && documentNumber.value.trim());
    const payload = {
      cliente_id: hasCustomer ? customer.value.id : null,
      cliente_datos: hasCustomer ? {
        numero_documento: documentNumber.value.trim(),
        nombre_razon_social: customer.value.nombre_razon_social || customer.value.nombre,
        tipo_documento: documentNumber.value.trim().length === 11 ? 'RUC' : 'DNI',
      } : null,
      metodo_pago: paymentMethod.value,
      detalles: cart.value.map((item) => ({ producto_id: item.producto_id, cantidad: item.cantidad, nombre_medico: item.nombre_medico, cmp_medico: item.cmp_medico })),
    };
    const { data } = await api.post('/ventas', payload);
    const saleId = data.venta_id || data.id || data.data?.id;
    cart.value = [];
    customer.value = null;
    documentNumber.value = '';
    await loadProducts();
    notify('Venta registrada correctamente.');
    if (saleId) window.open((api.defaults.baseURL || '') + '/ventas/' + saleId + '/ticket', '_blank', 'noopener');
  } catch (error) {
    notify(error.response?.data?.message || 'No fue posible registrar la venta.', 'error');
  } finally {
    processing.value = false;
  }
}
onMounted(loadProducts);
</script>