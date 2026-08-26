<template>
  <div class="min-h-screen w-full bg-gray-100 font-sans p-2 sm:p-4 flex flex-col justify-between">
    <!-- Layout Grid Adaptativo -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 w-full flex-1">
      
      <!-- PANEL IZQUIERDO: Buscador, Botones y Catálogo -->
      <div class="lg:col-span-7 flex flex-col gap-3">
        
        <!-- Header, Perfil & Buscador -->
        <div class="bg-white p-3 sm:p-4 rounded-xl shadow-sm flex flex-col gap-3 border border-gray-100">
          
          <!-- Barra Superior: Info Usuario + Botones Navegación -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-gray-500">Usuario:</span>
              <span class="text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">
                {{ usuario.name || 'Operador' }} ({{ usuarioRolDisplay }})
              </span>
            </div>

            <!-- Botones de Navegación -->
            <div class="flex flex-wrap gap-1.5 justify-end w-full sm:w-auto">
              <router-link 
                to="/ventas" 
                class="bg-gray-800 hover:bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 shadow transition"
              >
                📋 Historial
              </router-link>

              <router-link 
                to="/inventario" 
                class="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 shadow transition"
              >
                📦 Inventario
              </router-link>

              <router-link 
                to="/caja" 
                class="bg-green-700 hover:bg-green-800 text-white text-xs px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 shadow transition"
              >
                💵 Caja
              </router-link>

              <!-- Solo visibles para Admin -->
              <router-link 
                v-if="esAdmin"
                to="/reportes" 
                class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 shadow transition"
              >
                📊 Reportes
              </router-link>

              <router-link 
                v-if="esAdmin"
                to="/usuarios" 
                class="bg-amber-600 hover:bg-amber-700 text-white text-xs px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 shadow transition"
              >
                👥 Usuarios
              </router-link>

              <!-- Botón Cerrar Sesión -->
              <button 
                @click="cerrarSesion" 
                class="bg-red-600 hover:bg-red-700 text-white text-xs px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 shadow transition"
              >
                🚪 Salir
              </button>
            </div>
          </div>

          <!-- Buscador de Productos -->
          <div class="flex gap-2">
            <input 
              v-model="busqueda" 
              @keyup.enter="buscarProducto"
              type="text" 
              placeholder="Buscar por nombre o código de barras..." 
              class="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-xs sm:text-sm"
              ref="inputBusqueda"
            />
            <button 
              @click="buscarProducto" 
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition text-xs sm:text-sm whitespace-nowrap"
            >
              Buscar
            </button>
          </div>
        </div>

        <!-- Catálogo de Productos -->
        <div class="bg-white p-3 sm:p-4 rounded-xl shadow-sm flex-1 flex flex-col justify-between border border-gray-100">
          <div>
            <h2 class="text-base sm:text-lg font-bold text-gray-800 mb-3">Productos Disponibles</h2>
            
            <div v-if="cargandoProductos" class="text-center py-12 text-gray-500 text-sm">Cargando productos...</div>
            
            <div v-else class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
              <div 
                v-for="producto in productosFiltrados" 
                :key="producto.id"
                @click="agregarAlCarrito(producto)"
                class="p-2.5 sm:p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:shadow-md transition bg-gray-50 flex flex-col justify-between relative overflow-hidden"
              >
                <!-- Badges (Receta y Alerta FEFO) -->
                <div class="absolute top-0 right-1 sm:right-2 flex flex-col items-end gap-0.5 z-10">
                  <span 
                    v-if="producto.requiere_receta" 
                    class="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-b-md shadow-sm"
                  >
                    💊 Receta
                  </span>
                  <div 
                    v-if="obtenerAlertaVencimiento(producto)" 
                    :class="obtenerAlertaVencimiento(producto).clase"
                    class="text-[9px] font-bold px-1.5 py-0.5 rounded-b-md shadow-sm"
                  >
                    {{ obtenerAlertaVencimiento(producto).texto }}
                  </div>
                </div>

                <div class="mt-4 sm:mt-2">
                  <p class="font-bold text-gray-800 text-xs sm:text-sm line-clamp-1 pr-6">{{ producto.nombre }}</p>
                  <p class="text-[11px] text-gray-500">{{ producto.presentacion || 'Unidad' }}</p>
                  <p class="text-[11px] font-semibold mt-1" :class="producto.stock_actual > 5 ? 'text-green-600' : 'text-red-500'">
                    Stock: {{ producto.stock_actual }}
                  </p>
                </div>
                
                <div class="mt-2 text-right">
                  <span class="text-blue-600 font-extrabold text-sm sm:text-base">S/ {{ Number(producto.precio_venta).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PANEL DERECHO: Carrito, Cliente y Cobro -->
      <div class="lg:col-span-5 bg-white p-3 sm:p-4 rounded-xl shadow-sm flex flex-col justify-between border border-gray-200">
        <div>
          <h2 class="text-lg font-bold text-gray-800 pb-2 border-b border-gray-200">Detalle de Venta</h2>
          
          <!-- Búsqueda de Cliente -->
          <div class="my-3 flex gap-2">
            <input 
              v-model="numDoc" 
              @keyup.enter="buscarCliente"
              type="text" 
              placeholder="DNI / RUC del Cliente (Opcional)" 
              class="flex-1 p-2 text-xs sm:text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500"
            />
            <button 
              @click="buscarCliente" 
              class="bg-gray-800 hover:bg-gray-900 text-white text-xs px-3 rounded-lg font-semibold whitespace-nowrap"
            >
              RENIEC/SUNAT
            </button>
          </div>
          
          <p v-if="cliente" class="text-xs text-green-700 bg-green-50 p-2 rounded mb-2 font-medium">
            Cliente: <strong>{{ cliente.nombre_razon_social || cliente.nombre }}</strong>
          </p>

          <!-- Tabla del Carrito -->
          <div class="max-h-[40vh] lg:max-h-[45vh] overflow-y-auto my-2">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-gray-100 text-gray-600 text-[11px] uppercase sticky top-0">
                <tr>
                  <th class="p-2">Producto</th>
                  <th class="p-2 text-center">Cant.</th>
                  <th class="p-2 text-right">Subtotal</th>
                  <th class="p-2 text-center">✕</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="(item, index) in carrito" :key="item.producto_id">
                  <td class="p-2 font-medium text-xs">
                    {{ item.nombre }}
                    <span v-if="item.requiere_receta" class="block text-[10px] text-red-600 font-bold">
                      📋 CMP: {{ item.cmp_medico || 'Pendiente' }}
                    </span>
                  </td>
                  <td class="p-2 text-center">
                    <input 
                      type="number" 
                      min="1" 
                      v-model.number="item.cantidad" 
                      @change="validarCantidad(item)"
                      class="w-10 sm:w-12 text-center border rounded p-1 text-xs"
                    />
                  </td>
                  <td class="p-2 text-right font-bold text-xs whitespace-nowrap">S/ {{ (item.cantidad * item.precio_unitario).toFixed(2) }}</td>
                  <td class="p-2 text-center">
                    <button @click="eliminarDelCarrito(index)" class="text-red-500 font-bold hover:text-red-700">✕</button>
                  </td>
                </tr>
                <tr v-if="carrito.length === 0">
                  <td colspan="4" class="text-center py-8 text-gray-400 text-xs">El carrito está vacío</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Totales y Acción de Pago -->
        <div class="border-t border-gray-200 pt-3 mt-2">
          <div class="mb-3">
            <label class="block text-xs font-semibold text-gray-600 mb-1">Método de Pago:</label>
            <select v-model="metodoPago" class="w-full p-2 text-xs sm:text-sm border border-gray-300 rounded-lg outline-none font-medium">
              <option value="Efectivo">💵 Efectivo</option>
              <option value="Yape">📱 Yape</option>
              <option value="Plin">📱 Plin</option>
              <option value="Tarjeta">💳 Tarjeta de Débito/Crédito</option>
            </select>
          </div>

          <div class="flex justify-between items-center my-3 bg-blue-50 p-3 rounded-lg">
            <span class="text-sm sm:text-base font-bold text-gray-700">Total a Pagar:</span>
            <span class="text-xl sm:text-2xl font-black text-blue-600">S/ {{ totalVenta.toFixed(2) }}</span>
          </div>

          <button 
            @click="verificarCajaYVender" 
            :disabled="carrito.length === 0 || procesando"
            class="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg transition text-sm"
          >
            {{ procesando ? 'Procesando Venta...' : 'Completar Venta' }}
          </button>
        </div>
      </div>

    </div>

    <!-- MODAL REGISTRO DE RECETA MÉDICA -->
    <div v-if="mostrarModalReceta" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-sm">
        <h3 class="text-base sm:text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
          💊 Receta Médica Requerida
        </h3>
        <p class="text-xs text-gray-600 mb-4">
          El medicamento <strong>{{ productoSeleccionadoReceta?.nombre }}</strong> exige prescripción médica.
        </p>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Nombre del Médico / Cirujano:</label>
            <input 
              v-model="datosReceta.nombre_medico"
              type="text" 
              placeholder="Dr. Juan Pérez"
              class="w-full p-2 border border-gray-300 rounded text-xs sm:text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Colegiatura CMP / COP:</label>
            <input 
              v-model="datosReceta.cmp_medico"
              type="text" 
              placeholder="Ej. 084920"
              class="w-full p-2 border border-gray-300 rounded text-xs sm:text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div class="mt-5 flex gap-2 justify-end">
          <button 
            @click="cancelarReceta" 
            class="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded font-semibold"
          >
            Cancelar
          </button>
          <button 
            @click="confirmarAgregarReceta" 
            class="px-4 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded font-bold shadow"
          >
            Guardar e Incluir
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api/axios';

const router = useRouter();

// Usuario y Roles
const usuario = ref(JSON.parse(localStorage.getItem('usuario') || '{}'));

// Evaluación flexible de admin (acepta admin, administrador o roles en mayúsculas)
const esAdmin = computed(() => {
  const rol = (usuario.value.role || usuario.value.rol || '').toLowerCase();
  return rol === 'admin' || rol === 'administrador';
});

const usuarioRolDisplay = computed(() => {
  return usuario.value.role || usuario.value.rol || 'Cajero';
});

// Estado de la Vista
const productos = ref([]);
const busqueda = ref('');
const numDoc = ref('');
const cliente = ref(null);
const carrito = ref([]);
const metodoPago = ref('Efectivo');
const cargandoProductos = ref(false);
const procesando = ref(false);

// Modal Receta
const mostrarModalReceta = ref(false);
const productoSeleccionadoReceta = ref(null);
const datosReceta = ref({ nombre_medico: '', cmp_medico: '' });

watch(numDoc, (nuevoDoc) => {
  if (!nuevoDoc || nuevoDoc.trim() === '') {
    cliente.value = null;
  }
});

const obtenerProductos = async () => {
  cargandoProductos.value = true;
  try {
    const res = await api.get('/productos');
    productos.value = res.data.data || res.data;
  } catch (err) {
    console.error('Error al cargar productos:', err);
  } finally {
    cargandoProductos.value = false;
  }
};

const productosFiltrados = computed(() => {
  if (!busqueda.value.trim()) return productos.value;
  const q = busqueda.value.toLowerCase();
  return productos.value.filter(p => 
    p.nombre.toLowerCase().includes(q) || 
    (p.codigo_barras && p.codigo_barras.toLowerCase().includes(q))
  );
});

// Soporte para Lector de Código de Barras
const buscarProducto = () => {
  if (productosFiltrados.value.length === 1) {
    agregarAlCarrito(productosFiltrados.value[0]);
    busqueda.value = '';
  }
};

const obtenerAlertaVencimiento = (producto) => {
  if (!producto.lotes || producto.lotes.length === 0) return null;

  const loteMasProximo = producto.lotes[0];
  if (!loteMasProximo.fecha_vencimiento) return null;

  const hoy = new Date();
  const vence = new Date(loteMasProximo.fecha_vencimiento);
  const diffDias = Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24));

  if (diffDias <= 15) {
    return { texto: '⚠️ Vence pronto', clase: 'bg-red-500 text-white' };
  } else if (diffDias <= 60) {
    return { texto: '⏰ Vence < 60d', clase: 'bg-yellow-500 text-white' };
  }
  return null;
};

const agregarAlCarrito = (producto) => {
  if (producto.stock_actual <= 0) {
    alert('Sin stock disponible para este producto.');
    return;
  }

  if (producto.requiere_receta) {
    productoSeleccionadoReceta.value = producto;
    datosReceta.value = { nombre_medico: '', cmp_medico: '' };
    mostrarModalReceta.value = true;
    return;
  }

  insertarEnCarrito(producto);
};

const confirmarAgregarReceta = () => {
  if (!datosReceta.value.nombre_medico || !datosReceta.value.cmp_medico) {
    alert('Debe ingresar el Nombre del Médico y su Colegiatura (CMP).');
    return;
  }

  insertarEnCarrito(productoSeleccionadoReceta.value, datosReceta.value);
  mostrarModalReceta.value = false;
};

const cancelarReceta = () => {
  mostrarModalReceta.value = false;
  productoSeleccionadoReceta.value = null;
};

const insertarEnCarrito = (producto, receta = null) => {
  const existe = carrito.value.find(item => item.producto_id === producto.id);
  if (existe) {
    if (existe.cantidad + 1 > producto.stock_actual) {
      alert('Stock máximo alcanzado');
      return;
    }
    existe.cantidad++;
    if (receta) {
      existe.nombre_medico = receta.nombre_medico;
      existe.cmp_medico = receta.cmp_medico;
    }
  } else {
    carrito.value.push({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio_unitario: Number(producto.precio_venta),
      cantidad: 1,
      stock_max: producto.stock_actual,
      requiere_receta: Boolean(producto.requiere_receta),
      nombre_medico: receta ? receta.nombre_medico : null,
      cmp_medico: receta ? receta.cmp_medico : null,
    });
  }
};

const validarCantidad = (item) => {
  if (item.cantidad < 1) {
    item.cantidad = 1;
  }
  if (item.cantidad > item.stock_max) {
    item.cantidad = item.stock_max;
    alert('Cantidad supera el stock disponible');
  }
};

const eliminarDelCarrito = (index) => {
  carrito.value.splice(index, 1);
};

const totalVenta = computed(() => {
  return carrito.value.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0);
});

const buscarCliente = async () => {
  if (!numDoc.value || numDoc.value.trim() === '') {
    cliente.value = null;
    return;
  }
  try {
    const res = await api.get(`/clientes/buscar/${numDoc.value.trim()}`);
    cliente.value = res.data.data || res.data;
  } catch (err) {
    alert('Cliente no encontrado');
    cliente.value = null;
  }
};

const verificarCajaYVender = async () => {
  if (carrito.value.length === 0) return;
  
  try {
    const res = await api.get('/caja/estado');
    if (res.data.estado !== 'abierta') {
      alert('⚠️ No hay una caja abierta. Debes aperturar caja antes de vender.');
      router.push('/caja');
      return;
    }
    await procesarVenta();
  } catch (err) {
    await procesarVenta();
  }
};

const procesarVenta = async () => {
  procesando.value = true;

  try {
    const tieneCliente = cliente.value && numDoc.value.trim() !== '';

    const payload = {
      cliente_id: tieneCliente ? cliente.value.id : null,
      cliente_datos: tieneCliente ? {
        numero_documento: numDoc.value.trim(),
        nombre_razon_social: cliente.value.nombre_razon_social || cliente.value.nombre,
        tipo_documento: numDoc.value.trim().length === 11 ? 'RUC' : 'DNI'
      } : null,
      metodo_pago: metodoPago.value,
      detalles: carrito.value.map(item => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        nombre_medico: item.nombre_medico,
        cmp_medico: item.cmp_medico
      }))
    };

    const res = await api.post('/ventas', payload);
    const ventaId = res.data.venta_id || res.data.id || (res.data.data ? res.data.data.id : null);

    carrito.value = [];
    cliente.value = null;
    numDoc.value = '';
    await obtenerProductos();

    if (ventaId) {
      window.open(`http://localhost:8000/api/ventas/${ventaId}/ticket`, '_blank');
    }
  } catch (err) {
    alert(err.response?.data?.message || 'Error al procesar la venta');
  } finally {
    procesando.value = false;
  }
};

const cerrarSesion = async () => {
  try {
    await api.post('/logout');
  } catch (err) {
    console.error('Error cerrando sesión:', err);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    router.push('/login');
  }
};

onMounted(() => {
  obtenerProductos();
});
</script>