<template>
  <div class="p-6 bg-gray-100 min-h-screen font-sans">
    <div class="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-md">
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-3">
          <!-- Botón para retornar al Punto de Venta -->
          <router-link 
            to="/pos" 
            class="bg-gray-800 hover:bg-gray-900 text-white text-xs px-3 py-2 rounded-lg font-semibold transition flex items-center gap-1 shadow"
          >
            ⬅️ Ir al POS
          </router-link>
          <h1 class="text-2xl font-bold text-gray-800">Historial de Ventas</h1>
        </div>

        <button 
          @click="obtenerVentas" 
          class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-semibold transition"
        >
          Actualizar Lista
        </button>
      </div>

      <div v-if="cargando" class="text-center py-10 text-gray-500">Cargando ventas...</div>

      <div v-else-if="ventas.length === 0" class="text-center py-10 text-gray-400">
        No hay ventas registradas aún.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 text-gray-600 text-xs uppercase border-b border-gray-200">
              <th class="p-3">Comprobante</th>
              <th class="p-3">Cliente</th>
              <th class="p-3">Fecha</th>
              <th class="p-3">Pago</th>
              <th class="p-3 text-right">Total</th>
              <th class="p-3 text-center">Estado</th>
              <th class="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-sm">
            <tr v-for="venta in ventas" :key="venta.id" class="hover:bg-gray-50">
              <td class="p-3 font-bold text-gray-700">{{ venta.numero_comprobante }}</td>
              <td class="p-3">
                <p class="font-medium text-gray-800">
                  {{ venta.cliente ? (venta.cliente.nombre_razon_social || venta.cliente.nombre) : 'PÚBLICO GENERAL' }}
                </p>
                <p class="text-xs text-gray-400">
                  {{ venta.cliente ? venta.cliente.numero_documento : '00000000' }}
                </p>
              </td>
              <td class="p-3 text-xs text-gray-500">{{ formatearFecha(venta.created_at) }}</td>
              <td class="p-3 text-xs">{{ venta.metodo_pago }}</td>
              <td class="p-3 text-right font-extrabold text-blue-600">S/ {{ Number(venta.total).toFixed(2) }}</td>
              <td class="p-3 text-center">
                <span 
                  :class="venta.estado === 'completada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                  class="px-2 py-1 rounded-full text-xs font-semibold uppercase"
                >
                  {{ venta.estado }}
                </span>
              </td>
              <td class="p-3 text-center flex justify-center gap-2">
                <button 
                  @click="reimprimirTicket(venta.id)" 
                  class="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs px-2 py-1 rounded transition"
                  title="Reimprimir Ticket"
                >
                  🖨️ Ticket
                </button>
                <button 
                  v-if="venta.estado === 'completada'"
                  @click="anularVenta(venta)" 
                  class="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded transition"
                  title="Anular Venta"
                >
                  🚫 Anular
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api/axios';

const ventas = ref([]);
const cargando = ref(false);

const obtenerVentas = async () => {
  cargando.value = true;
  try {
    const res = await api.get('/ventas');
    ventas.value = Array.isArray(res.data) ? res.data : (res.data.data || []);
  } catch (err) {
    const msj = err.response?.data?.message || err.message;
    alert('Error al obtener la lista de ventas: ' + msj);
  } finally {
    cargando.value = false;
  }
};

const anularVenta = async (venta) => {
  const confirmacion = confirm(`¿Estás seguro de anular la venta ${venta.numero_comprobante}? El stock de los productos se devolverá automáticamente.`);
  if (!confirmacion) return;

  try {
    await api.post(`/ventas/${venta.id}/anular`);
    alert('Venta anulada y stock devuelto correctamente.');
    await obtenerVentas();
  } catch (err) {
    alert(err.response?.data?.message || 'Error al anular la venta');
  }
};

const reimprimirTicket = (ventaId) => {
  window.open(`http://localhost:8000/api/ventas/${ventaId}/ticket`, '_blank');
};

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '-';
  const fecha = new Date(fechaStr);
  return fecha.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
};

onMounted(() => {
  obtenerVentas();
});
</script>