import { computed, ref } from "vue";
import api from "../api/axios";

const defaults = {
  nombre_comercial: "Botica L y L",
  razon_social: "",
  ruc: "",
  direccion: "",
  telefono: "",
  email: "",
  logo_url: "",
  moneda: "PEN",
  simbolo_moneda: "S/",
  impuesto_nombre: "IGV",
  impuesto_porcentaje: 18,
  serie_comprobante: "B001",
  stock_minimo_default: 5,
  dias_alerta_vencimiento: 60,
  mensaje_ticket: "Gracias por su preferencia. Conserve su ticket para reclamos.",
  configuracion_completa: false,
  campos_pendientes: [],
};

export const businessConfig = ref({ ...defaults });
let loadingPromise;

export function applyBusinessConfig(value = {}) {
  businessConfig.value = { ...defaults, ...value };
  document.documentElement.style.setProperty("--business-name", `"${businessConfig.value.nombre_comercial}"`);
  const currentSection = document.title.split(" · ")[0] || "Gestión farmacéutica";
  document.title = `${currentSection} · ${businessConfig.value.nombre_comercial}`;
}

export async function loadBusinessConfig(force = false) {
  if (loadingPromise && !force) return loadingPromise;

  loadingPromise = api
    .get("/configuracion/publica")
    .then(({ data }) => {
      applyBusinessConfig(data);
      return businessConfig.value;
    })
    .catch(() => businessConfig.value)
    .finally(() => {
      loadingPromise = null;
    });

  return loadingPromise;
}

export function useBusinessConfig() {
  const businessName = computed(() => businessConfig.value.nombre_comercial || defaults.nombre_comercial);
  const currencySymbol = computed(() => businessConfig.value.simbolo_moneda || defaults.simbolo_moneda);
  const expiryDays = computed(() => businessConfig.value.dias_alerta_vencimiento || defaults.dias_alerta_vencimiento);

  return { businessConfig, businessName, currencySymbol, expiryDays, loadBusinessConfig, applyBusinessConfig };
}
