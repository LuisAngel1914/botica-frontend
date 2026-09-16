import { describe, expect, it } from "vitest";
import {
  expiryInfo,
  nextValidLot,
  requiresPrescription,
} from "./productPresentation";
describe("Product presentation", () => {
  it("uses the earliest nonempty, current lot regardless of API order", () => {
    const now = new Date(2026, 8, 16, 20);
    const product = {
      lotes: [
        { stock: 5, fecha_vencimiento: "2027-01-01" },
        { stock: 0, fecha_vencimiento: "2026-09-17" },
        { stock: 2, fecha_vencimiento: "2026-09-16" },
        { stock: 7, fecha_vencimiento: "2026-09-15" },
      ],
    };
    expect(nextValidLot(product, now).fecha_vencimiento).toBe("2026-09-16");
    expect(expiryInfo(product, now).tone).toBe("danger");
  });
  it("honors the sale condition and handles absent images/lots without guessing availability", () => {
    expect(
      requiresPrescription({
        condicion_venta: "receta_retenida",
        requiere_receta: false,
      }),
    ).toBe(true);
    expect(expiryInfo({ lotes: [] }).label).toBe("Sin lote vigente");
  });
});
