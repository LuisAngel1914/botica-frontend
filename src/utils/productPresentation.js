export const money = (value) => Number(value || 0).toFixed(2);
export const requiresPrescription = (product) =>
  (product.condicion_venta ||
    (product.requiere_receta ? "con_receta" : "libre")) !== "libre";
export const sellableStock = (product) => Number(product.stock_disponible || 0);

// Local calendar dates match the API's date-only lot contract.
export function nextValidLot(product, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return [...(product.lotes || [])]
    .filter(
      (lot) =>
        Number(lot.stock) > 0 &&
        new Date(lot.fecha_vencimiento + "T00:00:00") >= today,
    )
    .sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))[0];
}
export function expiryInfo(product, now = new Date()) {
  const lot = nextValidLot(product, now);
  if (!lot) return { label: "Sin lote vigente", tone: "neutral" };
  const date = new Date(lot.fecha_vencimiento + "T00:00:00");
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((date - today) / 86400000);
  return {
    label:
      "Vence " +
      date.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      }),
    tone: days <= 15 ? "danger" : days <= 60 ? "warning" : "neutral",
  };
}
