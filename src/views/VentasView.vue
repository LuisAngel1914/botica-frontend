<template>
  <div class="min-h-screen bg-gray-100 p-3 sm:p-6 font-sans">
    <div class="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      
      <!-- Cabecera y Navegación Responsiva -->
      <div class="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
            📋 Historial de Ventas
          </h1>
          <p class="text-xs text-gray-500 mt-0.5">Consulta, filtra y reimprime comprobantes de venta</p>
        </div>

        <div class="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <router-link 
            to="/" 
            class="flex-1 sm:flex-initial text-center bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-xl font-semibold shadow transition"
          >
            💻 Ir al POS
          </router-link>
          <router-link 
            to="/caja" 
            class="flex-1 sm:flex-initial text-center bg-green-700 hover:bg-green-800 text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-xl font-semibold shadow transition"
          >
            💵 Caja
          </router-link>
        </div>
      </div>

      <!-- Barra de Búsqueda y Filtros de Fecha -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div class="w-full md:flex-1">
          <input 
            v-model="busqueda"
            type="text" 
            placeholder="Buscar por cliente, DNI/RUC o N° Venta..." 
            class="w-full p-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500"
          />
        </div>

        <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-600">
          <div class="flex items-center gap-1.5 flex-1 sm:flex-none">
            <label>Desde:</label>
            <input 
              v-model="fechaInicio" 
              type="date" 
              class="w-full sm:w-auto p-2 border border-gray-300 rounded-lg outline-none text-xs"
            />
          </div>
          <div class="flex items-center gap-1.5 flex-1 sm:flex-none">
            <label>Hasta:</label>
            <input 
              v-model="fechaFin" 
              type="date" 
              class="w-full sm:w-auto p-2 border border-gray-300 rounded-lg outline-none text-xs"
            />
          </div>
          <button 
            @click="obtenerVentas" 
            class="w-full sm:w-auto bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold transition mt-1 sm:mt-0"
          >
            Filtrar
          </button>
        </div>
      </div>

      <!-- Tabla de Ventas (Scroll Horizontal en Móviles) -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div v-if="cargando" class="text-center py-12 text-gray-500 text-sm">Cargando historial de ventas...</div>

        <div v-else-if="ventasFiltradas.length > 0" class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr class="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-200">
                <th class="p-3.5">ID / Fecha</th>
                <th class="p-3.5">Cliente</th>
                <th class="p-3.5">Método Pago</th>
                <th class="p-3.5 text-right">Total</th>
                <th class="p-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 text-xs sm:text-sm">
              <tr v-for="venta in ventasFiltradas" :key="venta.id" class="hover:bg-gray-50/80 transition">
                <td class="p-3.5 whitespace-nowrap">
                  <span class="font-bold text-gray-800">#{{ venta.id }}</span>
                  <span class="block text-xs text-gray-500">{{ formatearFecha(venta.created_at) }}</span>
                </td>
                <td class="p-3.5">
                  <p class="font-semibold text-gray-700">
                    {{ venta.cliente?.nombre_razon_social || venta.cliente?.nombre || venta.cliente_datos?.nombre_razon_social || 'Cliente Eventual' }}
                  </p>
                  <span v-if="obtenerDocCliente(venta)" class="text-xs text-gray-400 font-mono">
                    {{ obtenerDocCliente(venta) }}
                  </span>
                </td>
                <td class="p-3.5 whitespace-nowrap">
                  <span :class="badgeMetodoPago(venta.metodo_pago)" class="text-xs font-bold px-2.5 py-1 rounded-md inline-block">
                    {{ venta.metodo_pago }}
                  </span>
                </td>
                <td class="p-3.5 text-right font-black text-blue-600 text-sm sm:text-base whitespace-nowrap">
                  S/ {{ Number(venta.total || calcularTotalLocal(venta)).toFixed(2) }}
                </td>
                <td class="p-3.5 text-center whitespace-nowrap">
                  <div class="flex items-center justify-center gap-1.5">
                    <button 
                      @click="verDetalle(venta)" 
                      class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2.5 py-1.5 rounded-lg font-bold transition"
                    >
                      👁️ Ver Detalle
                    </button>
                    <button 
                      @click="reimprimirTicket(venta.id)" 
                      class="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs px-2.5 py-1.5 rounded-lg font-bold transition"
                    >
                      🖨️ Ticket
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="text-center py-12 text-gray-400 text-sm">
          No se encontraron ventas registradas en el periodo seleccionado.
        </div>
      </div>
    </div>

    <!-- MODAL DETALLE DE VENTA RESPONSIVO -->
    <div v-if="modalDetalle" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
        <div class="bg-gray-800 text-white p-4 flex justify-between items-center">
          <h3 class="font-bold text-sm sm:text-base">Detalle de Venta #{{ ventaSeleccionada?.id }}</h3>
          <button @click="modalDetalle = false" class="text-gray-400 hover:text-white font-bold text-lg">✕</button>
        </div>

        <div class="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <!-- Info Comprobante -->
          <div class="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl text-xs">
            <div>
              <p class="text-gray-500">Fecha y Hora:</p>
              <p class="font-bold text-gray-800">{{ formatearFecha(ventaSeleccionada?.created_at) }}</p>
            </div>
            <div>
              <p class="text-gray-500">Método de Pago:</p>
              <p class="font-bold text-gray-800">{{ ventaSeleccionada?.metodo_pago }}</p>
            </div>
            <div class="col-span-2 border-t border-gray-200 pt-2">
              <p class="text-gray-500">Cliente:</p>
              <p class="font-bold text-gray-800">
                {{ ventaSeleccionada?.cliente?.nombre_razon_social || ventaSeleccionada?.cliente?.nombre || ventaSeleccionada?.cliente_datos?.nombre_razon_social || 'Cliente Eventual' }}
              </p>
            </div>
          </div>

          <!-- Items Vendidos -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse min-w-[300px]">
              <thead>
                <tr class="border-b border-gray-200 text-gray-500 uppercase">
                  <th class="py-2">Producto</th>
                  <th class="py-2 text-center">Cant.</th>
                  <th class="py-2 text-right">P. Unit</th>
                  <th class="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="item in ventaSeleccionada?.detalles" :key="item.id">
                  <td class="py-2.5">
                    <p class="font-semibold text-gray-800">{{ item.producto?.nombre || item.nombre }}</p>
                    <span v-if="item.cmp_medico" class="text-[10px] text-red-600 block font-bold">
                      💊 Médico: {{ item.nombre_medico || 'N/A' }} | CMP: {{ item.cmp_medico }}
                    </span>
                  </td>
                  <td class="py-2.5 text-center font-bold">{{ item.cantidad }}</td>
                  <td class="py-2.5 text-right whitespace-nowrap">S/ {{ Number(item.precio_unitario || item.precio).toFixed(2) }}</td>
                  <td class="py-2.5 text-right font-bold text-gray-800 whitespace-nowrap">
                    S/ {{ (Number(item.cantidad) * Number(item.precio_unitario || item.precio)).toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Total Modal -->
          <div class="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
            <span class="font-bold text-gray-700 text-xs sm:text-sm">Monto Total:</span>
            <span class="text-lg sm:text-xl font-black text-blue-600">
              S/ {{ Number(ventaSeleccionada?.total || calcularTotalLocal(ventaSeleccionada)).toFixed(2) }}
            </span>
          </div>
        </div>

        <div class="bg-gray-50 p-3 text-right border-t border-gray-100">
          <button 
            @click="modalDetalle = false" 
            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded-xl font-bold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../api/axios';

const ventas = ref([]);
const cargando = ref(false);
const busqueda = ref('');
const fechaInicio = ref('');
const fechaFin = ref('');

const modalDetalle = ref(false);
const ventaSeleccionada = ref(null);

const obtenerVentas = async () => {
  cargando.value = true;
  try {
    const params = {};
    if (fechaInicio.value) params.fecha_inicio = fechaInicio.value;
    if (fechaFin.value) params.fecha_fin = fechaFin.value;

    const res = await api.get('/ventas', { params });
    ventas.value = res.data.data || res.data;
  } catch (err) {
    console.error('Error al cargar ventas:', err);
  } finally {
    cargando.value = false;
  }
};

const ventasFiltradas = computed(() => {
  if (!busqueda.value.trim()) return ventas.value;
  const q = busqueda.value.toLowerCase();
  
  return ventas.value.filter(v => {
    const id = v.id.toString();
    const cliente = (v.cliente?.nombre_razon_social || v.cliente?.nombre || v.cliente_datos?.nombre_razon_social || '').toLowerCase();
    const doc = (v.cliente?.numero_documento || v.cliente_datos?.numero_documento || '').toLowerCase();
    return id.includes(q) || cliente.includes(q) || doc.includes(q);
  });
});

const obtenerDocCliente = (venta) => {
  return venta.cliente?.numero_documento || venta.cliente_datos?.numero_documento || null;
};

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '-';
  const fecha = new Date(fechaStr);
  return fecha.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const badgeMetodoPago = (metodo) => {
  switch (metodo) {
    case 'Efectivo': return 'bg-green-100 text-green-800';
    case 'Yape': return 'bg-purple-100 text-purple-800';
    case 'Plin': return 'bg-cyan-100 text-cyan-800';
    default: return 'bg-blue-100 text-blue-800';
  }
};

const calcularTotalLocal = (venta) => {
  if (!venta || !venta.detalles) return 0;
  return venta.detalles.reduce((acc, d) => acc + (Number(d.cantidad) * Number(d.precio_unitario || d.precio)), 0);
};

const verDetalle = (venta) => {
  ventaSeleccionada.value = venta;
  modalDetalle.value = true;
};

const reimprimirTicket = (ventaId) => {
  window.open(`http://localhost:8000/api/ventas/${ventaId}/ticket`, '_blank');
};

onMounted(() => {
  obtenerVentas();
});
</script>