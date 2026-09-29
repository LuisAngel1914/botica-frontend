<template>
  <div class="space-y-6">
    <PageHeader
      eyebrow="Administración"
      title="Configuración de la botica"
      description="Personaliza la identidad, comprobantes y reglas operativas de esta instalación."
    >
      <template #actions>
        <button class="btn btn-primary" form="business-settings" :disabled="saving || loading">
          <LoaderCircle v-if="saving" class="animate-spin" :size="17" />
          <Save v-else :size="17" />{{ saving ? "Guardando…" : "Guardar cambios" }}
        </button>
      </template>
    </PageHeader>

    <InlineNotice :notice="notice" @dismiss="notice = null" />

    <section class="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
      <div class="app-card overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white">
        <div class="flex items-start gap-4">
          <div class="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/30">
            <img v-if="form.logo_url" :src="form.logo_url" alt="Logo de la botica" class="h-full w-full object-cover" />
            <Cross v-else :size="28" />
          </div>
          <div class="min-w-0">
            <p class="text-[11px] font-semibold uppercase tracking-[.18em] text-cyan-300">Vista previa</p>
            <h2 class="mt-2 truncate text-2xl font-semibold">{{ form.nombre_comercial || "Tu botica" }}</h2>
            <p class="mt-1 text-sm text-slate-300">{{ form.razon_social || "Completa la razón social" }}</p>
          </div>
        </div>
        <div class="mt-8 grid gap-3 text-xs text-slate-300 sm:grid-cols-2">
          <p><span class="text-slate-500">RUC</span><br /><strong class="text-white">{{ form.ruc || "Pendiente" }}</strong></p>
          <p><span class="text-slate-500">Comprobantes</span><br /><strong class="text-white">{{ form.serie_comprobante || "B001" }}-000001</strong></p>
          <p><span class="text-slate-500">Moneda</span><br /><strong class="text-white">{{ form.simbolo_moneda }} · {{ form.moneda }}</strong></p>
          <p><span class="text-slate-500">Impuesto</span><br /><strong class="text-white">{{ form.impuesto_nombre }} {{ form.impuesto_porcentaje }}%</strong></p>
        </div>
      </div>

      <div class="app-card p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="section-kicker">Puesta en marcha</p>
            <h2 class="mt-1 text-lg font-bold text-slate-900">{{ completion }}% completado</h2>
          </div>
          <span class="grid h-11 w-11 place-items-center rounded-full" :class="completion === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'">
            <CheckCircle2 v-if="completion === 100" :size="22" /><WandSparkles v-else :size="22" />
          </span>
        </div>
        <div class="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full bg-cyan-600 transition-all" :style="{ width: completion + '%' }"></div></div>
        <p v-if="pendingLabels.length" class="mt-4 text-xs leading-5 text-slate-500">Completa: {{ pendingLabels.join(", ") }}.</p>
        <p v-else class="mt-4 text-xs leading-5 text-emerald-700">La identidad comercial está lista para tickets, reportes y acceso.</p>
      </div>
    </section>

    <form id="business-settings" class="space-y-6" @submit.prevent="save">
      <section class="app-card p-5 sm:p-6">
        <div class="mb-6">
          <p class="section-kicker">Identidad y contacto</p>
          <h2 class="mt-1 text-lg font-bold text-slate-900">Datos del negocio</h2>
          <p class="mt-1 text-sm text-slate-500">Estos datos aparecen en el acceso, comprobantes y reportes.</p>
        </div>
        <div class="grid gap-5 md:grid-cols-2">
          <label class="block"><span class="field-label">Nombre comercial *</span><input v-model.trim="form.nombre_comercial" class="field-control" required maxlength="120" /></label>
          <label class="block"><span class="field-label">Razón social</span><input v-model.trim="form.razon_social" class="field-control" maxlength="180" /></label>
          <label class="block"><span class="field-label">RUC</span><input v-model.trim="form.ruc" class="field-control" inputmode="numeric" pattern="[0-9]{11}" maxlength="11" placeholder="11 dígitos" /></label>
          <label class="block"><span class="field-label">Teléfono</span><input v-model.trim="form.telefono" class="field-control" maxlength="30" /></label>
          <label class="block md:col-span-2"><span class="field-label">Dirección</span><input v-model.trim="form.direccion" class="field-control" maxlength="255" /></label>
          <label class="block"><span class="field-label">Correo de contacto y reportes</span><input v-model.trim="form.email" class="field-control" type="email" maxlength="255" /></label>
          <label class="block"><span class="field-label">URL del logo</span><input v-model.trim="form.logo_url" class="field-control" type="url" placeholder="https://…" /></label>
        </div>
      </section>

      <section class="app-card p-5 sm:p-6">
        <div class="mb-6">
          <p class="section-kicker">Reglas operativas</p>
          <h2 class="mt-1 text-lg font-bold text-slate-900">Comprobantes, moneda y alertas</h2>
        </div>
        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <label class="block"><span class="field-label">Moneda</span><select v-model="form.moneda" class="field-control"><option value="PEN">Sol peruano (PEN)</option><option value="USD">Dólar (USD)</option></select></label>
          <label class="block"><span class="field-label">Símbolo</span><input v-model.trim="form.simbolo_moneda" class="field-control" required maxlength="5" /></label>
          <label class="block"><span class="field-label">Nombre del impuesto</span><input v-model.trim="form.impuesto_nombre" class="field-control" required maxlength="20" /></label>
          <label class="block"><span class="field-label">Impuesto (%)</span><input v-model.number="form.impuesto_porcentaje" class="field-control" type="number" min="0" max="100" step="0.01" required /></label>
          <label class="block"><span class="field-label">Serie de comprobante</span><input v-model.trim="form.serie_comprobante" class="field-control uppercase" pattern="[A-Z0-9-]+" maxlength="10" required /></label>
          <label class="block"><span class="field-label">Stock mínimo predeterminado</span><input v-model.number="form.stock_minimo_default" class="field-control" type="number" min="0" required /></label>
          <label class="block"><span class="field-label">Alerta de vencimiento (días)</span><input v-model.number="form.dias_alerta_vencimiento" class="field-control" type="number" min="1" max="365" required /></label>
          <label class="block xl:col-span-4"><span class="field-label">Mensaje al pie del ticket</span><input v-model.trim="form.mensaje_ticket" class="field-control" maxlength="255" required /></label>
        </div>
      </section>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { CheckCircle2, Cross, LoaderCircle, Save, WandSparkles } from "lucide-vue-next";
import api from "../api/axios";
import { applyBusinessConfig } from "../composables/useBusinessConfig";
import PageHeader from "../components/ui/PageHeader.vue";
import InlineNotice from "../components/ui/InlineNotice.vue";

const requiredFields = { nombre_comercial: "nombre comercial", razon_social: "razón social", ruc: "RUC", direccion: "dirección", telefono: "teléfono", email: "correo" };
const form = reactive({ nombre_comercial: "", razon_social: "", ruc: "", direccion: "", telefono: "", email: "", logo_url: "", moneda: "PEN", simbolo_moneda: "S/", impuesto_nombre: "IGV", impuesto_porcentaje: 18, serie_comprobante: "B001", stock_minimo_default: 5, dias_alerta_vencimiento: 60, mensaje_ticket: "Gracias por su preferencia. Conserve su ticket para reclamos." });
const loading = ref(true);
const saving = ref(false);
const notice = ref(null);
const pendingLabels = computed(() => Object.entries(requiredFields).filter(([field]) => !String(form[field] || "").trim()).map(([, label]) => label));
const completion = computed(() => Math.round(((Object.keys(requiredFields).length - pendingLabels.value.length) / Object.keys(requiredFields).length) * 100));

onMounted(load);
async function load() {
  try { const { data } = await api.get("/configuracion"); Object.assign(form, data); }
  catch (error) { notice.value = { type: "error", message: error.response?.data?.message || "No pudimos cargar la configuración." }; }
  finally { loading.value = false; }
}
async function save() {
  saving.value = true; notice.value = null;
  try {
    const { data } = await api.put("/configuracion", form);
    Object.assign(form, data.configuracion);
    applyBusinessConfig(data.configuracion);
    notice.value = { type: "success", message: data.message };
  } catch (error) {
    const errors = error.response?.data?.errors;
    notice.value = { type: "error", message: errors ? Object.values(errors).flat()[0] : (error.response?.data?.message || "No pudimos guardar los cambios.") };
  } finally { saving.value = false; }
}
</script>
