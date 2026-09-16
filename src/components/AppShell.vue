<template>
  <div>
    <a href="#main-content" class="skip-link">Saltar al contenido</a>
    <aside class="workspace-sidebar">
      <RouterLink :to="homePath" class="flex items-center gap-3 px-2"
        ><span class="brand-mark"><Cross :size="23" /></span
        ><span
          ><strong class="block text-sm font-semibold text-white"
            >Botica L y L</strong
          ><small class="text-[10px] text-slate-400"
            >Gestión farmacéutica</small
          ></span
        ></RouterLink
      >
      <AppNavigation :groups="navigationGroups" />
      <div class="mt-auto border-t border-white/10 px-2 pt-5">
        <div class="mb-4 flex items-center gap-3">
          <span
            class="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white"
            >{{ initials }}</span
          ><span class="min-w-0"
            ><strong class="block truncate text-xs font-medium text-white">{{
              currentUser.name || "Operador"
            }}</strong
            ><small class="text-[10px] text-slate-400">{{
              roleLabel
            }}</small></span
          >
        </div>
        <button class="workspace-nav-link w-full text-xs" @click="logout">
          <LogOut :size="16" />Cerrar sesión
        </button>
      </div>
    </aside>
    <main class="workspace-main">
      <header class="workspace-topbar">
        <div class="flex min-w-0 items-center gap-2">
          <button
            class="icon-button lg:hidden"
            aria-label="Abrir navegación"
            @click="menuOpen = true"
          >
            <Menu :size="21" />
          </button>
          <div class="min-w-0">
            <p class="text-[10px] text-slate-500">
              Espacio de trabajo <span class="mx-1">/</span> {{ roleLabel }}
            </p>
            <h1 class="truncate text-sm font-semibold text-slate-900">
              {{ title }}
            </h1>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-3">
          <span class="hidden text-[11px] text-slate-500 xl:block">{{
            today
          }}</span
          ><button
            class="btn btn-secondary !px-3 !text-xs"
            :aria-expanded="assistantOpen"
            aria-controls="assistant-panel"
            @click="assistantOpen = !assistantOpen"
          >
            <Sparkles :size="16" /><span class="hidden sm:inline"
              >Asistente</span
            ><span class="sr-only sm:hidden">Abrir asistente</span></button
          ><span
            class="grid h-8 w-8 place-items-center rounded-full bg-cyan-50 text-[10px] font-bold text-cyan-800 lg:hidden"
            >{{ initials }}</span
          >
        </div>
      </header>
      <section id="main-content" tabindex="-1" class="workspace-content">
        <ChatIaModal
          v-model:open="assistantOpen"
          :context="route.name"
        /><slot />
      </section>
    </main>
    <AppDialog
      :open="menuOpen"
      label="Navegación principal"
      @close="menuOpen = false"
    >
      <div class="mobile-nav-dialog">
        <div class="flex items-center justify-between">
          <strong class="text-sm text-white">Botica L y L</strong
          ><button
            class="icon-button !text-white"
            aria-label="Cerrar navegación"
            @click="menuOpen = false"
          >
            <X :size="20" />
          </button>
        </div>
        <AppNavigation
          :groups="navigationGroups"
          @navigate="menuOpen = false"
        /><button
          class="workspace-nav-link mt-5 w-full border-t border-white/10"
          @click="logout"
        >
          <LogOut :size="17" />Cerrar sesión
        </button>
      </div>
    </AppDialog>
  </div>
</template>
<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Boxes,
  CircleDollarSign,
  ClipboardList,
  Cross,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingCart,
  Sparkles,
  Truck,
  Users,
  UserRoundCog,
  X,
} from "lucide-vue-next";
import { useAuth } from "../composables/useAuth";
import api from "../api/axios";
import ChatIaModal from "./ChatIaModal.vue";
import AppDialog from "./ui/AppDialog.vue";
import AppNavigation from "./AppNavigation.vue";
const route = useRoute();
const router = useRouter();
const { currentUser, role, isAdmin, clearSession } = useAuth();
const menuOpen = ref(false);
const assistantOpen = ref(false);
const homePath = computed(() => (isAdmin.value ? "/dashboard" : "/pos"));
const roleLabel = computed(() =>
  role.value === "admin" ? "Administración" : "Cajero",
);
const navigationGroups = computed(() => [
  {
    label: "Operación diaria",
    items: [
      ...(isAdmin.value
        ? [
            {
              to: "/dashboard",
              label: "Resumen ejecutivo",
              icon: LayoutDashboard,
            },
          ]
        : []),
      { to: "/pos", label: "Punto de venta", icon: ShoppingCart },
      { to: "/caja", label: "Control de caja", icon: CircleDollarSign },
      ...(isAdmin.value
        ? [{ to: "/ventas", label: "Ventas", icon: ClipboardList }]
        : []),
    ],
  },
  ...(isAdmin.value
    ? [
        {
          label: "Gestión comercial",
          items: [
            { to: "/inventario", label: "Inventario y lotes", icon: Boxes },
            { to: "/compras", label: "Compras", icon: Truck },
            { to: "/clientes", label: "Clientes", icon: Users },
          ],
        },
        {
          label: "Administración",
          items: [
            { to: "/actividad", label: "Actividad", icon: History },
            {
              to: "/usuarios",
              label: "Usuarios y accesos",
              icon: UserRoundCog,
            },
          ],
        },
      ]
    : []),
]);
const title = computed(() => route.meta.title || "Panel de operaciones");
const initials = computed(() =>
  (currentUser.value.name || "OP")
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase(),
);
const today = new Date().toLocaleDateString("es-PE", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false;
    assistantOpen.value = false;
  },
);
async function logout() {
  try {
    await api.post("/logout");
  } catch {
    /* Clear local session even if the network fails. */
  }
  clearSession();
  await router.replace({ name: "login" });
}
</script>
