<template>
  <div class="p-6 bg-gray-100 min-h-screen font-sans">
    <div class="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-md">
      
      <!-- Encabezado con navegación -->
      <div class="flex justify-between items-center mb-6 border-b pb-4">
        <router-link to="/pos" class="bg-gray-800 hover:bg-gray-900 text-white text-xs px-3 py-2 rounded-lg font-semibold">
          ⬅️ Ir al POS
        </router-link>
        <h1 class="text-xl font-bold text-gray-800">Control de Caja</h1>
      </div>

      <div v-if="cargando" class="text-center py-8 text-gray-500">Cargando estado de caja...</div>

      <!-- VISTA: APERTURA DE CAJA -->
      <div v-else-if="estado === 'cerrada'" class="space-y-4">
        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded text-yellow-800 text-sm">
          ⚠️ <strong>Caja Cerrada:</strong> Debes ingresar el monto base para aperturar el turno antes de realizar ventas.
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Monto Inicial en Caja (S/):</label>
          <input 
            v-model.number="montoInicial" 
            type="number" 
            step="0.10" 
            placeholder="0.00" 
            class="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
          />
        </div>

        <button 
          @click="abrirCaja" 
          :disabled="montoInicial === null || montoInicial < 0"
          class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg shadow transition disabled:opacity-50"
        >
          🔓 Abrir Caja
        </button>
      </div>

      <!-- VISTA: CIERRE / ESTADO DE CAJA -->
      <div v-else class="space-y-5">
        <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded text-green-800 text-sm flex justify-between items-center">
          <span>🟢 <strong>Caja Abierta</strong></span>
          <span class="text-xs text-gray-500">Desde: {{ formatearFecha(datosCaja.caja?.fecha_apertura) }}</span>
        </div>

        <!-- Desglose de ingresos por método de pago -->
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-gray-50 p-3 rounded-lg border">
            <p class="text-xs text-gray-500 font-semibold">Monto Inicial</p>
            <p class="text-lg font-bold text-gray-800">S/ {{ datosCaja.monto_inicial?.toFixed(2) }}</p>
          </div>
          <div class="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <p class="text-xs text-blue-600 font-semibold">Ventas Efectivo</p>
            <p class="text-lg font-bold text-blue-700">S/ {{ datosCaja.ventas_efectivo?.toFixed(2) }}</p>
          </div>
          <div class="bg-purple-50 p-3 rounded-lg border border-purple-100">
            <p class="text-xs text-purple-600 font-semibold">Digital (Yape/Tarj.)</p>
            <p class="text-lg font-bold text-purple-700">S/ {{ datosCaja.ventas_digitales?.toFixed(2) }}</p>
          </div>
        </div>

        <div class="bg-gray-800 text-white p-4 rounded-lg flex justify-between items-center">
          <div>
            <span class="text-sm font-medium block">Efectivo Total Esperado en Cajón:</span>
            <span class="text-xs text-gray-400">(Monto Inicial + Ventas en Efectivo)</span>
          </div>
          <span class="text-2xl font-black text-green-400">S/ {{ datosCaja.monto_esperado?.toFixed(2) }}</span>
        </div>

        <hr class="my-4"/>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Monto Real Recontado en Arqueo (S/):</label>
          <input 
            v-model.number="montoFinal" 
            type="number" 
            step="0.10" 
            placeholder="Ingresa el efectivo contado..." 
            class="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
          />
        </div>

        <button 
          @click="cerrarCaja" 
          :disabled="montoFinal === null || montoFinal < 0"
          class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg shadow transition disabled:opacity-50"
        >
          🔒 Realizar Cierre de Caja
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api/axios';

const estado = ref('cerrada');
const cargando = ref(true);
const datosCaja = ref({});
const montoInicial = ref(0);
const montoFinal = ref(null);

const obtenerEstadoCaja = async () => {
  cargando.value = true;
  try {
    const res = await api.get('/caja/estado');
    estado.value = res.data.estado;
    datosCaja.value = res.data;
  } catch (err) {
    alert('Error al consultar el estado de la caja.');
  } finally {
    cargando.value = false;
  }
};

const abrirCaja = async () => {
  try {
    await api.post('/caja/abrir', { monto_inicial: montoInicial.value });
    alert('Caja abierta correctamente.');
    await obtenerEstadoCaja();
  } catch (err) {
    alert(err.response?.data?.message || 'Error al abrir caja');
  }
};

const cerrarCaja = async () => {
  if (!confirm('¿Estás seguro de cerrar la caja actual?')) return;

  try {
    const res = await api.post('/caja/cerrar', { monto_final: montoFinal.value });
    const r = res.data.resumen;
    alert(
      `Cierre Exitoso:\n` +
      `- Efectivo Esperado: S/ ${r.monto_esperado.toFixed(2)}\n` +
      `- Efectivo Recaudado: S/ ${r.monto_real.toFixed(2)}\n` +
      `- Ventas Digitales: S/ ${(r.ventas_digitales || 0).toFixed(2)}\n` +
      `- Diferencia Arqueo: S/ ${r.diferencia.toFixed(2)}`
    );
    montoFinal.value = null;
    await obtenerEstadoCaja();
  } catch (err) {
    alert(err.response?.data?.message || 'Error al cerrar caja');
  }
};

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '-';
  return new Date(fechaStr).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
};

onMounted(() => {
  obtenerEstadoCaja();
});
</script>