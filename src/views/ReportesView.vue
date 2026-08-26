<template>
  <div class="min-h-screen bg-gray-100 font-sans p-4 sm:p-6 print:bg-white print:p-0">
    <div class="max-w-7xl mx-auto space-y-6 print:max-w-full">
      
      <!-- HEADER INTERFAZ WEB (Oculto al imprimir o guardar en PDF) -->
      <div class="bg-white p-5 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-gray-100 print:hidden">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
            📊 Reportes y Estadísticas
          </h1>
          <p class="text-xs sm:text-sm text-gray-500 mt-1">
            Resumen general del rendimiento de ventas e inventario
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <button 
            @click="exportarExcel" 
            :disabled="cargando"
            class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 shadow transition disabled:opacity-50"
          >
            📊 Exportar Excel
          </button>

          <button 
            @click="exportarPDF" 
            :disabled="cargando"
            class="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 shadow transition disabled:opacity-50"
          >
            📄 Descargar PDF
          </button>

          <button 
            @click="cargarDatosReportes" 
            :disabled="cargando"
            class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm px-3.5 py-2 rounded-lg font-semibold transition flex items-center gap-2 disabled:opacity-50"
          >
            <span :class="{ 'animate-spin': cargando }">🔄</span>
            {{ cargando ? 'Cargando...' : 'Actualizar' }}
          </button>

          <router-link 
            to="/pos" 
            class="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3.5 py-2 rounded-lg font-semibold shadow transition"
          >
            ← Volver al POS
          </router-link>
        </div>
      </div>

      <!-- MEMBRETE CORPORATIVO EXCLUSIVO PARA PDF/IMPRESIÓN -->
      <div class="hidden print:block border-b-2 border-gray-800 pb-4 mb-6">
        <div class="flex justify-between items-start">
          <div class="flex items-center gap-3">
            <!-- Si tienes un logo, reemplaza la ruta src="/logo.png" por la tuya -->
            <img v-if="logoUrl" :src="logoUrl" alt="Logo Botica" class="h-12 w-auto object-contain" />
            <div>
              <h1 class="text-2xl font-black text-gray-900 uppercase tracking-wide">FARMACIA / BOTICA</h1>
              <p class="text-xs text-gray-600">Reporte Consolidado de Ventas e Inventario</p>
              <p class="text-xs text-gray-500 mt-0.5">Generado por: Administrador del Sistema</p>
            </div>
          </div>
          <div class="text-right">
            <span class="inline-block bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded tracking-wider">REPORTE OFICIAL</span>
            <p class="text-xs text-gray-600 mt-2"><strong>Emisión:</strong> {{ fechaActual }}</p>
          </div>
        </div>
      </div>

      <!-- BLOQUE 1: INDICADORES CLAVE (KPIs) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
        <div class="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-600 print:border print:p-3 print:rounded-none">
          <p class="text-xs font-bold uppercase text-gray-400">Ventas Hoy</p>
          <h3 class="text-2xl font-black text-gray-800 mt-1">S/ {{ formatearMonto(totalVentasHoy) }}</h3>
          <span class="text-[11px] text-gray-500 mt-1 block">{{ transaccionesHoy }} transacciones</span>
        </div>

        <div class="bg-white p-5 rounded-xl shadow-sm border-l-4 border-green-500 print:border print:p-3 print:rounded-none">
          <p class="text-xs font-bold uppercase text-gray-400">Recaudación Efectivo</p>
          <h3 class="text-2xl font-black text-gray-800 mt-1">S/ {{ formatearMonto(totalEfectivo) }}</h3>
          <span class="text-[11px] text-gray-500 mt-1 block">Disponible en caja</span>
        </div>

        <div class="bg-white p-5 rounded-xl shadow-sm border-l-4 border-purple-500 print:border print:p-3 print:rounded-none">
          <p class="text-xs font-bold uppercase text-gray-400">Pagos Digitales</p>
          <h3 class="text-2xl font-black text-gray-800 mt-1">S/ {{ formatearMonto(totalDigital) }}</h3>
          <span class="text-[11px] text-gray-500 mt-1 block">Yape / Plin / Tarjetas</span>
        </div>

        <div class="bg-white p-5 rounded-xl shadow-sm border-l-4 border-red-500 print:border print:p-3 print:rounded-none">
          <p class="text-xs font-bold uppercase text-gray-400">Recetas Procesadas</p>
          <h3 class="text-2xl font-black text-gray-800 mt-1">{{ totalRecetas }}</h3>
          <span class="text-[11px] text-gray-500 mt-1 block">Ventas Rx registradas</span>
        </div>
      </div>

      <!-- BLOQUE 2: TABLAS DE DETALLE -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block print:space-y-6">
        
        <!-- Tabla: Top Productos Más Vendidos -->
        <div class="lg:col-span-7 bg-white p-5 rounded-xl shadow-sm border border-gray-100 print:border print:shadow-none print:p-4">
          <h2 class="text-base font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
            🏆 Top Productos Más Vendidos
          </h2>
          <table class="w-full text-left text-xs sm:text-sm border-collapse">
            <thead class="bg-gray-100 text-gray-700 uppercase text-[10px] print:bg-gray-200">
              <tr>
                <th class="p-2.5 border-b">#</th>
                <th class="p-2.5 border-b">Producto</th>
                <th class="p-2.5 text-center border-b">Unidades</th>
                <th class="p-2.5 text-right border-b">Monto Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="(prod, idx) in topProductos" :key="idx" class="hover:bg-gray-50/50">
                <td class="p-2.5 font-bold text-gray-500 w-8">{{ idx + 1 }}</td>
                <td class="p-2.5 font-semibold text-gray-800">{{ prod.nombre }}</td>
                <td class="p-2.5 text-center font-bold text-gray-700">{{ prod.unidades }}</td>
                <td class="p-2.5 text-right font-black text-blue-600 print:text-gray-900">S/ {{ formatearMonto(prod.monto) }}</td>
              </tr>
              <tr v-if="topProductos.length === 0">
                <td colspan="4" class="text-center py-6 text-gray-400 text-xs">Sin registros de ventas aún</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Panel: Distribución de Pagos -->
        <div class="lg:col-span-5 bg-white p-5 rounded-xl shadow-sm border border-gray-100 print:border print:shadow-none print:p-4">
          <h2 class="text-base font-bold text-gray-800 mb-4 border-b pb-2">💳 Distribución de Pagos</h2>
          
          <table class="w-full text-left text-xs sm:text-sm border-collapse">
            <thead class="bg-gray-100 text-gray-700 uppercase text-[10px] print:bg-gray-200">
              <tr>
                <th class="p-2.5 border-b">Método</th>
                <th class="p-2.5 text-center border-b">%</th>
                <th class="p-2.5 text-right border-b">Monto Recaudado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="(monto, metodo) in desglosePagos" :key="metodo">
                <td class="p-2.5 font-semibold text-gray-800">{{ metodo }}</td>
                <td class="p-2.5 text-center text-gray-500 font-bold">{{ calcularPorcentaje(monto) }}%</td>
                <td class="p-2.5 text-right font-black text-gray-900">S/ {{ formatearMonto(monto) }}</td>
              </tr>
              <tr v-if="Object.keys(desglosePagos).length === 0">
                <td colspan="3" class="text-center py-6 text-gray-400 text-xs">Sin movimientos registrados</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <!-- PIE DE PÁGINA EXCLUSIVO PARA IMPRESIÓN -->
      <div class="hidden print:block text-center border-t pt-4 text-[10px] text-gray-500">
        Este documento es un reporte consolidado emitido automáticamente por el Sistema POS Botica.
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import api from '../api/axios';

const totalVentasHoy = ref(0);
const transaccionesHoy = ref(0);
const totalEfectivo = ref(0);
const totalDigital = ref(0);
const totalRecetas = ref(0);
const topProductos = ref([]);
const desglosePagos = ref({});
const cargando = ref(false);
const logoUrl = ref(''); // Asigna aquí la URL de tu logo si la tienes (ej: '/logo.png')

const fechaActual = computed(() => new Date().toLocaleDateString('es-PE', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
}));

const formatearMonto = (valor) => {
  const num = Number(valor);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

const calcularPorcentaje = (monto) => {
  const total = Number(totalVentasHoy.value);
  if (!total || total === 0) return 0;
  return Math.min(100, Math.round((Number(monto) / total) * 100));
};

const cargarDatosReportes = async () => {
  cargando.value = true;
  try {
    const res = await api.get('/reportes/resumen');
    const data = res.data || {};

    totalVentasHoy.value = Number(data.total_ventas_hoy) || 0;
    transaccionesHoy.value = Number(data.transacciones_hoy) || 0;
    totalEfectivo.value = Number(data.total_efectivo) || 0;
    totalDigital.value = Number(data.total_digital) || 0;
    totalRecetas.value = Number(data.total_recetas) || 0;
    
    topProductos.value = Array.isArray(data.top_productos) ? data.top_productos : [];
    desglosePagos.value = data.desglose_pagos || {};
  } catch (err) {
    console.error('Error al obtener reportes:', err);
  } finally {
    cargando.value = false;
  }
};

// EXPORTACIÓN A EXCEL EJECUTIVO CON EXCELJS
const exportarExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reporte de Ventas');

  worksheet.views = [{ showGridLines: true }];

  // Paleta de colores y fuentes corporativas
  const azulOscuro = '1E3A8A';
  const grisHeader = 'F3F4F6';
  const grisBorde = 'E5E7EB';

  const fontHeader = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  const fontSubHeader = { name: 'Arial', size: 10, bold: true, color: { argb: '374151' } };
  const fontSec = { name: 'Arial', size: 11, bold: true, color: { argb: '1F2937' } };

  worksheet.columns = [
    { key: 'colA', width: 6 },
    { key: 'colB', width: 34 },
    { key: 'colC', width: 22 },
    { key: 'colD', width: 25 }
  ];

  // 1. BANNER ENCABEZADO
  worksheet.mergeCells('A1:D2');
  const banner = worksheet.getCell('A1');
  banner.value = 'FARMACIA / BOTICA - REPORTE GENERAL DE VENTAS';
  banner.font = fontHeader;
  banner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: azulOscuro } };
  banner.alignment = { vertical: 'middle', horizontal: 'center' };

  worksheet.mergeCells('A3:D3');
  const sub = worksheet.getCell('A3');
  sub.value = `Fecha de emisión: ${fechaActual.value}`;
  sub.font = { name: 'Arial', size: 9, italic: true, color: { argb: '6B7280' } };
  sub.alignment = { vertical: 'middle', horizontal: 'center' };

  worksheet.addRow([]);

  // 2. SECCIÓN KPIs
  const sec1 = worksheet.addRow(['', 'INDICADORES PRINCIPALES (KPIs)']);
  worksheet.mergeCells(`B${sec1.number}:D${sec1.number}`);
  worksheet.getCell(`B${sec1.number}`).font = fontSec;

  const rowKpiHead = worksheet.addRow(['', 'Métrica', 'Valor Registrado', 'Detalle / Estado']);
  rowKpiHead.eachCell((cell, colIndex) => {
    if (colIndex > 1) {
      cell.font = fontSubHeader;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: grisHeader } };
      cell.border = { bottom: { style: 'medium', color: { argb: '9CA3AF' } } };
    }
  });

  const kpis = [
    ['Ventas Totales Hoy', `S/ ${formatearMonto(totalVentasHoy.value)}`, 'Monto bruto acumulado'],
    ['Transacciones Realizadas', transaccionesHoy.value, 'Tickets emitidos'],
    ['Recaudación en Efectivo', `S/ ${formatearMonto(totalEfectivo.value)}`, 'Disponible en caja física'],
    ['Pagos Digitales (Yape/Plin)', `S/ ${formatearMonto(totalDigital.value)}`, 'Transferencias / POS'],
    ['Recetas Procesadas', totalRecetas.value, 'Ventas con receta médica']
  ];

  kpis.forEach(kpi => {
    const r = worksheet.addRow(['', kpi[0], kpi[1], kpi[2]]);
    r.getCell(2).font = { name: 'Arial', size: 10, bold: true };
    r.getCell(3).alignment = { horizontal: 'right' };
    r.getCell(3).font = { name: 'Arial', size: 10, bold: true, color: { argb: '1D4ED8' } };
    r.getCell(4).font = { name: 'Arial', size: 9, color: { argb: '6B7280' } };
    
    [2, 3, 4].forEach(c => {
      r.getCell(c).border = { bottom: { style: 'thin', color: { argb: grisBorde } } };
    });
  });

  worksheet.addRow([]);

  // 3. SECCIÓN TOP PRODUCTOS
  const sec2 = worksheet.addRow(['', 'TOP 5 PRODUCTOS MÁS VENDIDOS']);
  worksheet.mergeCells(`B${sec2.number}:D${sec2.number}`);
  worksheet.getCell(`B${sec2.number}`).font = fontSec;

  const rowProdHead = worksheet.addRow(['#', 'Producto', 'Unidades Vendidas', 'Total Recaudado']);
  rowProdHead.eachCell(cell => {
    cell.font = fontSubHeader;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: grisHeader } };
    cell.border = { bottom: { style: 'medium', color: { argb: '9CA3AF' } } };
  });
  rowProdHead.getCell(1).alignment = { horizontal: 'center' };
  rowProdHead.getCell(3).alignment = { horizontal: 'center' };
  rowProdHead.getCell(4).alignment = { horizontal: 'right' };

  topProductos.value.forEach((p, index) => {
    const r = worksheet.addRow([
      index + 1,
      p.nombre,
      p.unidades,
      `S/ ${Number(p.monto).toFixed(2)}`
    ]);
    r.getCell(1).alignment = { horizontal: 'center' };
    r.getCell(3).alignment = { horizontal: 'center' };
    r.getCell(4).alignment = { horizontal: 'right' };
    r.getCell(4).font = { name: 'Arial', size: 10, bold: true };

    [1, 2, 3, 4].forEach(c => {
      r.getCell(c).border = { bottom: { style: 'thin', color: { argb: grisBorde } } };
    });
  });

  worksheet.addRow([]);

  // 4. SECCIÓN MÉTODOS DE PAGO
  const sec3 = worksheet.addRow(['', 'DISTRIBUCIÓN DE MÉTODOS DE PAGO']);
  worksheet.mergeCells(`B${sec3.number}:D${sec3.number}`);
  worksheet.getCell(`B${sec3.number}`).font = fontSec;

  const rowPagoHead = worksheet.addRow(['', 'Método de Pago', 'Monto Total', 'Porcentaje']);
  rowPagoHead.eachCell((cell, colIndex) => {
    if (colIndex > 1) {
      cell.font = fontSubHeader;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: grisHeader } };
      cell.border = { bottom: { style: 'medium', color: { argb: '9CA3AF' } } };
    }
  });
  rowPagoHead.getCell(3).alignment = { horizontal: 'right' };
  rowPagoHead.getCell(4).alignment = { horizontal: 'center' };

  Object.entries(desglosePagos.value).forEach(([metodo, monto]) => {
    const r = worksheet.addRow([
      '',
      metodo,
      `S/ ${Number(monto).toFixed(2)}`,
      `${calcularPorcentaje(monto)}%`
    ]);
    r.getCell(3).alignment = { horizontal: 'right' };
    r.getCell(4).alignment = { horizontal: 'center' };

    [2, 3, 4].forEach(c => {
      r.getCell(c).border = { bottom: { style: 'thin', color: { argb: grisBorde } } };
    });
  });

  // Exportar descarga
  const buffer = await workbook.xlsx.writeBuffer();
  const fecha = new Date().toISOString().split('T')[0];
  saveAs(new Blob([buffer]), `Reporte_Ventas_Botica_${fecha}.xlsx`);
};

const exportarPDF = () => {
  window.print();
};

onMounted(() => {
  cargarDatosReportes();
});
</script>

<style>
@media print {
  @page {
    size: A4 portrait;
    margin: 1.2cm;
  }
  body {
    background: white !important;
    color: black !important;
  }
}
</style>