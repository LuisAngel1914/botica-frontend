const money = (value) => `S/ ${Number(value || 0).toFixed(2)}`;

const metric = (label, value, tone = 'default') => ({ label, value, tone });

export function createAssistantPresentation(code, data = {}) {
  switch (code) {
    case 'CASH_STATUS':
      return {
        title: 'Estado de caja',
        tone: data.estado === 'abierta' ? 'success' : 'neutral',
        metrics: [
          metric('Estado', data.estado === 'abierta' ? 'Abierta' : 'Cerrada', data.estado === 'abierta' ? 'success' : 'default'),
          ...(data.estado === 'abierta' ? [metric('Efectivo', money(data.ventas_efectivo)), metric('Esperado', money(data.monto_esperado), 'accent')] : []),
        ],
        action: { label: 'Ver caja', route: 'caja' },
      };
    case 'SALES_TODAY':
      return {
        title: data.alcance === 'propio' ? 'Mis ventas de hoy' : 'Ventas de hoy',
        tone: 'accent',
        metrics: [metric('Completadas', String(data.cantidad_ventas || 0)), metric('Total', money(data.total_ventas), 'accent')],
        action: { label: 'Ver ventas', route: 'ventas' },
      };
    case 'REPORT_SUMMARY':
      return {
        title: 'Resumen operativo',
        tone: 'accent',
        metrics: [
          metric('Ventas', String(data.ventas_completadas || 0)),
          metric('Total', money(data.total_ventas), 'accent'),
          metric('Stock crítico', String(data.productos_stock_critico || 0), Number(data.productos_stock_critico) > 0 ? 'warning' : 'success'),
        ],
        action: { label: 'Abrir reportes', route: 'reportes' },
      };
    case 'INVENTORY_ALERTS':
      return {
        title: 'Alertas de inventario',
        tone: 'warning',
        metrics: [
          metric('Stock crítico', String(data.stock_critico || 0), Number(data.stock_critico) > 0 ? 'warning' : 'success'),
          metric('Por vencer', String(data.lotes_por_vencer || 0), Number(data.lotes_por_vencer) > 0 ? 'warning' : 'success'),
          metric('Vencidos', String(data.lotes_vencidos || 0), Number(data.lotes_vencidos) > 0 ? 'danger' : 'success'),
        ],
        action: { label: 'Ver inventario', route: 'inventario' },
      };
    case 'CLIENT_FOUND':
      return {
        title: 'Cliente encontrado',
        tone: 'success',
        details: [
          ['Documento', `${data.tipo_documento || 'Documento'} ${data.numero_documento || ''}`.trim()],
          ['Nombre', data.nombre_razon_social || 'Sin nombre registrado'],
          ...(data.ventas_registradas !== undefined ? [['Ventas registradas', String(data.ventas_registradas)]] : []),
        ],
      };
    case 'USERS_SUMMARY':
      return {
        title: 'Usuarios del sistema',
        tone: 'accent',
        metrics: [metric('Activos', String(data.usuarios_activos || 0), 'success'), metric('Registrados', String(data.usuarios_total || 0))],
        action: { label: 'Ver usuarios', route: 'usuarios' },
      };
    case 'FORBIDDEN_MODULE':
      return { title: 'Acceso restringido', tone: 'warning' };
    case 'ACTION_REQUIRES_MODULE':
      return { title: 'Acción protegida', tone: 'warning' };
    case 'MEDICAL_ADVICE_UNAVAILABLE':
      return { title: 'Consulta clínica no disponible', tone: 'warning' };
    case 'OUT_OF_SCOPE':
      return { title: 'Consulta fuera de Botica L y L', tone: 'neutral' };
    default:
      return null;
  }
}
