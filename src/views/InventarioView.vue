<template>
  <div class="space-y-6">
    <div class="mx-auto max-w-7xl">
      <PageHeader eyebrow="Catálogo y abastecimiento" title="Inventario y lotes" description="Administra existencias, precios, vencimientos, imágenes y productos bajo receta.">
        <template #actions><button class="btn btn-primary" @click="abrirModalProducto()">Nuevo producto</button></template>
      </PageHeader>

      <div class="mb-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[760px] text-left text-sm">
            <thead class="bg-slate-950 text-xs uppercase tracking-wider text-slate-300">
              <tr>
                <th class="p-3">Producto</th>
                <th class="p-3">Código</th>
                <th class="p-3">Presentación</th>
                <th class="p-3 text-center">Receta</th>
                <th class="p-3 text-center">Stock</th>
                <th class="p-3 text-right">Precio</th>
                <th class="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="prod in productos" :key="prod.id" class="transition hover:bg-slate-50">
                <td class="p-3">
                  <div class="flex min-w-[190px] items-center gap-3">
                    <div class="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-cyan-50 text-xs font-bold text-cyan-700">
                      <img v-if="prod.imagen_url && !brokenImageIds.has(prod.id)" :src="prod.imagen_url" :alt="prod.nombre" class="h-full w-full object-cover" @error="hideBrokenImage(prod.id)" />
                      <span v-else>{{ initials(prod.nombre) }}</span>
                    </div>
                    <div><p class="font-bold text-slate-800">{{ prod.nombre }}</p><p class="text-xs text-slate-500">{{ prod.principio_activo || 'Sin principio activo' }}</p></div>
                  </div>
                </td>
                <td class="whitespace-nowrap p-3 font-mono text-xs text-slate-500">{{ prod.codigo_barras || '-' }}</td>
                <td class="whitespace-nowrap p-3 text-xs text-slate-600">{{ prod.presentacion || '-' }}</td>
                <td class="whitespace-nowrap p-3 text-center">
                  <span :class="prod.requiere_receta ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'" class="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold">{{ prod.requiere_receta ? 'Con receta' : 'Libre' }}</span>
                </td>
                <td class="whitespace-nowrap p-3 text-center font-bold" :class="prod.stock_actual > 5 ? 'text-emerald-600' : 'text-red-600'">{{ prod.stock_actual }}</td>
                <td class="whitespace-nowrap p-3 text-right font-bold text-cyan-700">S/ {{ Number(prod.precio_venta).toFixed(2) }}</td>
                <td class="whitespace-nowrap p-3 text-center">
                  <div class="flex justify-center gap-1.5">
                    <button class="rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-violet-700" @click="abrirModalLote(prod)">+ Lote</button>
                    <button class="rounded-lg bg-amber-400 px-2.5 py-1 text-xs font-semibold text-slate-900 transition hover:bg-amber-500" @click="abrirModalProducto(prod)">Editar</button>
                  </div>
                </td>
              </tr>
              <tr v-if="productos.length === 0"><td colspan="7" class="py-10 text-center text-slate-400">No hay productos registrados en el inventario.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="mostrarModalProd" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
        <h3 class="mb-4 text-lg font-bold text-slate-800">{{ formProd.id ? 'Editar producto' : 'Nuevo producto' }}</h3>
        <div class="space-y-3">
          <div><label class="mb-1 block text-xs font-semibold text-slate-700">Nombre comercial</label><input v-model.trim="formProd.nombre" type="text" class="field-control" placeholder="Ej. Amoxicilina 500 mg" /></div>
          <div><label class="mb-1 block text-xs font-semibold text-slate-700">Código de barras</label><input v-model.trim="formProd.codigo_barras" type="text" class="field-control" placeholder="Opcional" /></div>
          <div><label class="mb-1 block text-xs font-semibold text-slate-700">Presentación</label><input v-model.trim="formProd.presentacion" type="text" class="field-control" placeholder="Ej. Caja x 100 tabletas" /></div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">URL de imagen oficial</label>
            <input v-model.trim="formProd.imagen_url" type="url" class="field-control" placeholder="https://…" />
            <p class="mt-1 text-[11px] text-slate-500">Usa una imagen oficial del fabricante o una foto propia del empaque.</p>
          </div>
          <div v-if="formProd.imagen_url" class="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
            <img :src="formProd.imagen_url" alt="Vista previa del producto" class="mx-auto h-24 max-w-full rounded-lg object-contain" @error="formProd.imagen_url = ''" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div><label class="mb-1 block text-xs font-semibold text-slate-700">Precio compra</label><input v-model.number="formProd.precio_compra" type="number" min="0" step="0.10" class="field-control" /></div>
            <div><label class="mb-1 block text-xs font-semibold text-slate-700">Precio venta</label><input v-model.number="formProd.precio_venta" type="number" min="0" step="0.10" class="field-control" /></div>
          </div>
          <label class="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3"><input id="recetaCheck" v-model="formProd.requiere_receta" type="checkbox" class="h-4 w-4 rounded text-red-600" /><span class="text-xs font-bold text-red-700">Requiere receta médica</span></label>
        </div>
        <div class="mt-5 flex justify-end gap-2"><button class="btn btn-secondary" @click="mostrarModalProd = false">Cancelar</button><button class="btn btn-primary" @click="guardarProducto">Guardar</button></div>
      </div>
    </div>

    <div v-if="mostrarModalLote" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div class="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl sm:p-6">
        <h3 class="mb-1 text-lg font-bold text-violet-700">Ingresar nuevo lote</h3>
        <p class="mb-4 text-xs text-slate-500">Producto: <strong>{{ prodSeleccionado?.nombre }}</strong></p>
        <div class="space-y-3">
          <div><label class="mb-1 block text-xs font-semibold text-slate-700">Código de lote</label><input v-model.trim="formLote.numero_lote" type="text" placeholder="Ej. LOT-2026-A" class="field-control" /></div>
          <div><label class="mb-1 block text-xs font-semibold text-slate-700">Cantidad a ingresar</label><input v-model.number="formLote.stock_ingresado" type="number" min="1" class="field-control" /></div>
          <div><label class="mb-1 block text-xs font-semibold text-slate-700">Fecha de vencimiento</label><input v-model="formLote.fecha_vencimiento" type="date" class="field-control" /></div>
        </div>
        <div class="mt-5 flex justify-end gap-2"><button class="btn btn-secondary" @click="mostrarModalLote = false">Cancelar</button><button class="btn bg-violet-600 text-white hover:bg-violet-700" @click="guardarLote">Registrar lote</button></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api/axios';
import PageHeader from '../components/ui/PageHeader.vue';

const productos = ref([]);
const mostrarModalProd = ref(false);
const mostrarModalLote = ref(false);
const prodSeleccionado = ref(null);
const brokenImageIds = ref(new Set());

const emptyProduct = () => ({ id: null, nombre: '', codigo_barras: '', presentacion: '', imagen_url: '', precio_compra: 0, precio_venta: 0, stock_actual: 0, stock_minimo: 5, requiere_receta: false });
const formProd = ref(emptyProduct());
const formLote = ref({ numero_lote: '', stock_ingresado: 10, fecha_vencimiento: '' });

const initials = (name = '') => name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase() || 'RX';
const hideBrokenImage = (productId) => { brokenImageIds.value = new Set([...brokenImageIds.value, productId]); };

async function cargarProductos() {
  try {
    const res = await api.get('/productos');
    productos.value = res.data.data || res.data || [];
  } catch (err) {
    console.error('Error al cargar productos:', err);
  }
}

function abrirModalProducto(prod = null) {
  formProd.value = prod ? {
    id: prod.id, nombre: prod.nombre, codigo_barras: prod.codigo_barras || '', presentacion: prod.presentacion || '',
    imagen_url: prod.imagen_url || '', precio_compra: prod.precio_compra || 0, precio_venta: prod.precio_venta || 0,
    stock_actual: prod.stock_actual || 0, stock_minimo: prod.stock_minimo || 5, requiere_receta: Boolean(prod.requiere_receta),
  } : emptyProduct();
  mostrarModalProd.value = true;
}

async function guardarProducto() {
  try {
    const payload = {
      nombre: formProd.value.nombre, codigo_barras: formProd.value.codigo_barras || null, presentacion: formProd.value.presentacion || null,
      imagen_url: formProd.value.imagen_url || null, precio_compra: Number(formProd.value.precio_compra || 0),
      precio_venta: Number(formProd.value.precio_venta || 0), stock_actual: Number(formProd.value.stock_actual || 0),
      stock_minimo: Number(formProd.value.stock_minimo || 5), requiere_receta: Boolean(formProd.value.requiere_receta),
    };
    if (formProd.value.id) await api.put(`/productos/${formProd.value.id}`, payload);
    else await api.post('/productos', payload);
    mostrarModalProd.value = false;
    await cargarProductos();
  } catch (err) {
    const errorDetails = err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join('\n') : (err.response?.data?.message || 'Error al guardar el producto');
    alert(`No se pudo guardar:\n${errorDetails}`);
  }
}

function abrirModalLote(prod) {
  prodSeleccionado.value = prod;
  formLote.value = { numero_lote: '', stock_ingresado: 10, fecha_vencimiento: '' };
  mostrarModalLote.value = true;
}

async function guardarLote() {
  try {
    const payload = { producto_id: prodSeleccionado.value.id, numero_lote: formLote.value.numero_lote, stock: Number(formLote.value.stock_ingresado), cantidad: Number(formLote.value.stock_ingresado), stock_ingresado: Number(formLote.value.stock_ingresado), fecha_vencimiento: formLote.value.fecha_vencimiento };
    await api.post('/inventario/lote', payload);
    mostrarModalLote.value = false;
    await cargarProductos();
  } catch (err) {
    const errorDetails = err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join('\n') : (err.response?.data?.message || 'Error al registrar el lote');
    alert(`No se pudo registrar el lote:\n${errorDetails}`);
  }
}

onMounted(cargarProductos);
</script>