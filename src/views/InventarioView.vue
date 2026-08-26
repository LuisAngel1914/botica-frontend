<template>
  <div class="p-3 sm:p-6 bg-gray-100 min-h-screen font-sans">
    <div class="max-w-7xl mx-auto">
      
      <!-- ENCABEZADO Y BOTONES DE NAVEGACIÓN RESPONSIVOS -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-800">Gestión de Inventario y Lotes</h1>
          <p class="text-xs text-gray-500">Administración de stock, precios y control FEFO / recetas</p>
        </div>
        <div class="flex flex-wrap gap-2 w-full sm:w-auto">
          <router-link to="/pos" class="flex-1 sm:flex-initial text-center bg-gray-800 text-white text-xs px-4 py-2.5 rounded-lg font-bold hover:bg-gray-900 shadow transition">
            🛒 Ir al POS
          </router-link>
          <button @click="abrirModalProducto()" class="flex-1 sm:flex-initial bg-blue-600 text-white text-xs px-4 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow transition">
            + Nuevo Producto
          </button>
        </div>
      </div>

      <!-- TABLA DE PRODUCTOS (Scroll Horizontal en Movil) -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm min-w-[700px]">
            <thead class="bg-gray-800 text-white text-xs uppercase tracking-wider">
              <tr>
                <th class="p-3">Código</th>
                <th class="p-3">Producto</th>
                <th class="p-3">Presentación</th>
                <th class="p-3 text-center">Receta</th>
                <th class="p-3 text-center">Stock Total</th>
                <th class="p-3 text-right">Precio Venta</th>
                <th class="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="prod in productos" :key="prod.id" class="hover:bg-gray-50 transition">
                <td class="p-3 text-xs font-mono text-gray-500 whitespace-nowrap">{{ prod.codigo_barras || '-' }}</td>
                <td class="p-3 font-bold text-gray-800">{{ prod.nombre }}</td>
                <td class="p-3 text-xs text-gray-600 whitespace-nowrap">{{ prod.presentacion || '-' }}</td>
                <td class="p-3 text-center whitespace-nowrap">
                  <span 
                    :class="prod.requiere_receta ? 'bg-red-100 text-red-700 font-bold' : 'bg-gray-100 text-gray-500'" 
                    class="text-[10px] px-2 py-0.5 rounded-full inline-block"
                  >
                    {{ prod.requiere_receta ? 'Sí (💊 Receta)' : 'No' }}
                  </span>
                </td>
                <td class="p-3 text-center font-bold whitespace-nowrap" :class="prod.stock_actual > 5 ? 'text-green-600' : 'text-red-600'">
                  {{ prod.stock_actual }}
                </td>
                <td class="p-3 text-right font-bold text-blue-600 whitespace-nowrap">S/ {{ Number(prod.precio_venta).toFixed(2) }}</td>
                <td class="p-3 text-center whitespace-nowrap">
                  <div class="flex justify-center gap-1.5">
                    <button @click="abrirModalLote(prod)" class="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2.5 py-1 rounded font-semibold transition">
                      + Lote
                    </button>
                    <button @click="abrirModalProducto(prod)" class="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-2.5 py-1 rounded font-semibold transition">
                      ✏️ Editar
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="productos.length === 0">
                <td colspan="7" class="text-center py-8 text-gray-400">No hay productos registrados en el inventario.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- MODAL CREAR / EDITAR PRODUCTO RESPONSIVO -->
    <div v-if="mostrarModalProd" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white p-5 sm:p-6 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold text-gray-800 mb-4">
          {{ formProd.id ? 'Editar Producto' : 'Nuevo Producto' }}
        </h3>
        
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Nombre Comercial:</label>
            <input v-model="formProd.nombre" type="text" class="w-full p-2 border border-gray-300 rounded text-xs sm:text-sm outline-none focus:border-blue-500" placeholder="Ej. Amoxicilina 500mg" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Código de Barras:</label>
            <input v-model="formProd.codigo_barras" type="text" class="w-full p-2 border border-gray-300 rounded text-xs sm:text-sm outline-none focus:border-blue-500" placeholder="Opcional" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Presentación:</label>
            <input v-model="formProd.presentacion" type="text" class="w-full p-2 border border-gray-300 rounded text-xs sm:text-sm outline-none focus:border-blue-500" placeholder="Ej. Caja x 100 tab" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Precio Compra:</label>
              <input v-model.number="formProd.precio_compra" type="number" step="0.10" class="w-full p-2 border border-gray-300 rounded text-xs sm:text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Precio Venta:</label>
              <input v-model.number="formProd.precio_venta" type="number" step="0.10" class="w-full p-2 border border-gray-300 rounded text-xs sm:text-sm outline-none focus:border-blue-500" />
            </div>
          </div>
          
          <!-- CHECKBOX VENTA BAJO RECETA -->
          <div class="flex items-center gap-2 bg-red-50 p-2.5 rounded border border-red-200 mt-2">
            <input id="recetaCheck" v-model="formProd.requiere_receta" type="checkbox" class="w-4 h-4 text-red-600 rounded cursor-pointer" />
            <label for="recetaCheck" class="text-xs font-bold text-red-700 cursor-pointer select-none">
              💊 ¿Requiere Receta Médica?
            </label>
          </div>
        </div>

        <div class="mt-5 flex gap-2 justify-end">
          <button @click="mostrarModalProd = false" class="px-3 py-1.5 text-xs text-gray-600 font-semibold hover:bg-gray-100 rounded">Cancelar</button>
          <button @click="guardarProducto" class="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow">Guardar</button>
        </div>
      </div>
    </div>

    <!-- MODAL REGISTRO DE LOTE RESPONSIVO -->
    <div v-if="mostrarModalLote" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white p-5 sm:p-6 rounded-xl shadow-xl w-full max-w-sm">
        <h3 class="text-lg font-bold text-purple-700 mb-1">Ingresar Nuevo Lote</h3>
        <p class="text-xs text-gray-500 mb-4">Producto: <strong>{{ prodSeleccionado?.nombre }}</strong></p>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Código de Lote:</label>
            <input v-model="formLote.numero_lote" type="text" placeholder="Ej. LOT-2026-A" class="w-full p-2 border border-gray-300 rounded text-xs sm:text-sm outline-none focus:border-purple-500" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Cantidad a ingresar:</label>
            <input v-model.number="formLote.stock_ingresado" type="number" min="1" class="w-full p-2 border border-gray-300 rounded text-xs sm:text-sm outline-none focus:border-purple-500" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Fecha de Vencimiento:</label>
            <input v-model="formLote.fecha_vencimiento" type="date" class="w-full p-2 border border-gray-300 rounded text-xs sm:text-sm outline-none focus:border-purple-500" />
          </div>
        </div>

        <div class="mt-5 flex gap-2 justify-end">
          <button @click="mostrarModalLote = false" class="px-3 py-1.5 text-xs text-gray-600 font-semibold hover:bg-gray-100 rounded">Cancelar</button>
          <button @click="guardarLote" class="px-4 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded font-bold shadow">Registrar Lote</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api/axios';

const productos = ref([]);
const mostrarModalProd = ref(false);
const mostrarModalLote = ref(false);
const prodSeleccionado = ref(null);

const formProd = ref({
  id: null,
  nombre: '',
  codigo_barras: '',
  presentacion: '',
  precio_compra: 0,
  precio_venta: 0,
  stock_actual: 0,
  stock_minimo: 5,
  requiere_receta: false
});

const formLote = ref({
  numero_lote: '',
  stock_ingresado: 10,
  fecha_vencimiento: ''
});

const cargarProductos = async () => {
  try {
    const res = await api.get('/productos');
    productos.value = res.data;
  } catch (err) {
    console.error('Error al cargar productos:', err);
  }
};

const abrirModalProducto = (prod = null) => {
  if (prod) {
    formProd.value = { 
      id: prod.id, 
      nombre: prod.nombre, 
      codigo_barras: prod.codigo_barras || '', 
      presentacion: prod.presentacion || '', 
      precio_compra: prod.precio_compra || 0,
      precio_venta: prod.precio_venta || 0,
      stock_actual: prod.stock_actual || 0,
      stock_minimo: prod.stock_minimo || 5,
      requiere_receta: Boolean(prod.requiere_receta) 
    };
  } else {
    formProd.value = { 
      id: null, 
      nombre: '', 
      codigo_barras: '', 
      presentacion: '', 
      precio_compra: 0,
      precio_venta: 0, 
      stock_actual: 0,
      stock_minimo: 5,
      requiere_receta: false 
    };
  }
  mostrarModalProd.value = true;
};

const guardarProducto = async () => {
  try {
    const payload = {
      nombre: formProd.value.nombre,
      codigo_barras: formProd.value.codigo_barras || null,
      presentacion: formProd.value.presentacion || null,
      precio_compra: Number(formProd.value.precio_compra || 0),
      precio_venta: Number(formProd.value.precio_venta || 0),
      stock_actual: Number(formProd.value.stock_actual || 0),
      stock_minimo: Number(formProd.value.stock_minimo || 5),
      requiere_receta: Boolean(formProd.value.requiere_receta)
    };

    if (formProd.value.id) {
      await api.put(`/productos/${formProd.value.id}`, payload);
    } else {
      await api.post('/productos', payload);
    }
    
    mostrarModalProd.value = false;
    cargarProductos();
  } catch (err) {
    const errorDetails = err.response?.data?.errors 
      ? Object.values(err.response.data.errors).flat().join('\n') 
      : (err.response?.data?.message || 'Error al guardar el producto');
    alert(`No se pudo guardar:\n${errorDetails}`);
  }
};

const abrirModalLote = (prod) => {
  prodSeleccionado.value = prod;
  formLote.value = { numero_lote: '', stock_ingresado: 10, fecha_vencimiento: '' };
  mostrarModalLote.value = true;
};

const guardarLote = async () => {
  try {
    const payload = {
      producto_id: prodSeleccionado.value.id,
      numero_lote: formLote.value.numero_lote,
      stock: Number(formLote.value.stock_ingresado),
      cantidad: Number(formLote.value.stock_ingresado),
      stock_ingresado: Number(formLote.value.stock_ingresado),
      fecha_vencimiento: formLote.value.fecha_vencimiento
    };

    await api.post('/inventario/lote', payload);
    mostrarModalLote.value = false;
    cargarProductos();
  } catch (err) {
    const errorDetails = err.response?.data?.errors 
      ? Object.values(err.response.data.errors).flat().join('\n') 
      : (err.response?.data?.message || 'Error al registrar el lote');
    alert(`No se pudo registrar el lote:\n${errorDetails}`);
  }
};

onMounted(() => {
  cargarProductos();
});
</script>