import { describe, expect, it } from 'vitest';
import { createAssistantPresentation } from './assistantPresentation';

describe('createAssistantPresentation', () => {
  it('builds actionable cash metrics from a safe API response', () => {
    expect(createAssistantPresentation('CASH_STATUS', { estado: 'abierta', ventas_efectivo: 25, monto_esperado: 125 })).toMatchObject({
      title: 'Estado de caja',
      action: { route: 'caja' },
      metrics: [{ label: 'Estado', value: 'Abierta' }, { label: 'Efectivo', value: 'S/ 25.00' }, { label: 'Esperado', value: 'S/ 125.00' }],
    });
  });

  it('marks expired lots as a danger inventory metric', () => {
    const presentation = createAssistantPresentation('INVENTORY_ALERTS', { stock_critico: 0, lotes_por_vencer: 1, lotes_vencidos: 2 });
    expect(presentation.metrics.find((item) => item.label === 'Vencidos')).toMatchObject({ value: '2', tone: 'danger' });
  });

  it('does not create a data card for unrelated responses', () => {
    expect(createAssistantPresentation('NO_CATALOG_MATCH')).toBeNull();
  });
});
