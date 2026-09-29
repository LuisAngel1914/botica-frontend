<template>
  <main class="login-layout">
    <section class="login-story">
      <div class="flex items-center gap-3">
        <span class="brand-mark"><img v-if="businessConfig.logo_url" :src="businessConfig.logo_url" alt="" class="h-full w-full rounded-[inherit] object-cover" /><Cross v-else :size="23" /></span>
        <div>
          <strong class="block text-base font-semibold">{{ businessName }}</strong
          ><span class="text-[11px] text-slate-400">Gestión farmacéutica</span>
        </div>
      </div>
      <div class="my-12 max-w-md">
        <p
          class="text-[11px] font-semibold uppercase tracking-[.2em] text-cyan-300"
        >
          Cada detalle cuenta
        </p>
        <h1 class="mt-5 text-5xl font-semibold leading-[1.13] tracking-tight">
          Más claridad.<br />Mejor atención.
        </h1>
        <p class="mt-6 max-w-sm text-base leading-7 text-slate-300">
          Un espacio para cuidar tu inventario, acompañar a tu equipo y mantener
          cada venta bajo control.
        </p>
        <div class="mt-10">
          <div class="login-feature">
            <span><ScanBarcode :size="20" /></span>
            <div>
              <h2 class="text-sm font-medium">Ventas sin perder el ritmo</h2>
              <p class="mt-1 text-xs text-slate-400">
                Catálogo, recetas y cobro en un solo flujo.
              </p>
            </div>
          </div>
          <div class="login-feature">
            <span><Boxes :size="20" /></span>
            <div>
              <h2 class="text-sm font-medium">Existencias con trazabilidad</h2>
              <p class="mt-1 text-xs text-slate-400">
                Lotes, vencimientos y movimientos a la vista.
              </p>
            </div>
          </div>
          <div class="login-feature">
            <span><ShieldCheck :size="20" /></span>
            <div>
              <h2 class="text-sm font-medium">Cada rol en su lugar</h2>
              <p class="mt-1 text-xs text-slate-400">
                Acceso según las responsabilidades del equipo.
              </p>
            </div>
          </div>
        </div>
      </div>
      <p class="text-[10px] text-slate-400">
        © {{ year }} {{ businessName }} · Gestión comercial
      </p>
    </section>
    <section class="login-form-area">
      <div class="w-full max-w-[360px]">
        <div class="mb-12 flex items-center gap-3 lg:hidden">
          <span class="brand-mark"><img v-if="businessConfig.logo_url" :src="businessConfig.logo_url" alt="" class="h-full w-full rounded-[inherit] object-cover" /><Cross v-else :size="22" /></span
          ><strong class="text-sm">{{ businessName }}</strong>
        </div>
        <span
          class="mb-6 grid h-12 w-12 place-items-center rounded-xl border bg-slate-50 text-cyan-700"
          ><LockKeyhole :size="21"
        /></span>
        <p class="section-kicker">Tu espacio de trabajo</p>
        <h2 class="mt-2 text-[30px] font-semibold tracking-tight">
          Bienvenido de nuevo
        </h2>
        <p class="mt-3 text-sm leading-6 text-slate-500">
          Ingresa con tu cuenta para continuar con la operación de la botica.
        </p>
        <p
          v-if="sessionExpired"
          class="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800"
          role="status"
        >
          Tu sesión terminó por seguridad. Ingresa nuevamente para continuar.
        </p>
        <form class="mt-8 space-y-5" @submit.prevent="handleLogin">
          <div>
            <label class="field-label" for="email">Correo electrónico</label
            ><input
              id="email"
              v-model.trim="email"
              class="field-control"
              type="email"
              autocomplete="username"
              required
              placeholder="nombre@botica.com"
              :disabled="loading"
            />
          </div>
          <div>
            <label class="field-label" for="password">Contraseña</label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                class="field-control pr-12"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                placeholder="Ingresa tu contraseña"
                :disabled="loading"
              /><button
                class="icon-button absolute right-0 top-0"
                type="button"
                :aria-label="
                  showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                "
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" :size="17" /><Eye
                  v-else
                  :size="17"
                />
              </button>
            </div>
          </div>
          <p
            v-if="error"
            class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-800"
            role="alert"
          >
            {{ error }}
          </p>
          <button
            class="btn btn-primary !mt-7 w-full !py-3"
            type="submit"
            :disabled="loading"
          >
            <LoaderCircle v-if="loading" class="animate-spin" :size="18" />{{
              loading ? "Validando acceso…" : "Ingresar a la botica"
            }}<ArrowRight v-if="!loading" :size="17" class="ml-auto" />
          </button>
        </form>
        <p
          class="mt-8 border-t pt-5 text-center text-[11px] leading-5 text-slate-500"
        >
          ¿Necesitas acceso? Contacta al administrador de tu botica.
        </p>
      </div>
    </section>
  </main>
</template>
<script setup>
import { computed, ref } from "vue";
import {
  ArrowRight,
  Boxes,
  Cross,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  ScanBarcode,
  ShieldCheck,
} from "lucide-vue-next";
import { useRoute, useRouter } from "vue-router";
import api from "../api/axios";
import { useAuth } from "../composables/useAuth";
import { useBusinessConfig } from "../composables/useBusinessConfig";

const router = useRouter();
const route = useRoute();
const { setSession } = useAuth();
const { businessConfig, businessName } = useBusinessConfig();
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const showPassword = ref(false);
const year = new Date().getFullYear();
const sessionExpired = computed(() => route.query.notice === "session-expired");

async function handleLogin() {
  loading.value = true;
  error.value = "";
  try {
    const { data } = await api.post("/login", {
      email: email.value,
      password: password.value,
    });
    setSession({ token: data.access_token || data.token, user: data.user });
    await router.replace({
      name: data.user?.role === "admin" ? "dashboard" : "pos",
    });
  } catch (err) {
    error.value =
      err.response?.data?.message ||
      "No pudimos iniciar sesión. Verifica tus credenciales e inténtalo de nuevo.";
  } finally {
    loading.value = false;
  }
}
</script>
