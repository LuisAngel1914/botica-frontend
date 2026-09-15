<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-slate-800 bg-slate-950 p-4 lg:flex">
      <RouterLink :to="homePath" class="mb-7 flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-white/5"><span class="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-cyan-500 font-black text-slate-950 shadow-lg shadow-cyan-500/20">B</span><span><strong class="block text-sm text-white">Botica L y L</strong><small class="text-slate-400">Centro de operaciones</small></span></RouterLink>
      <p class="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Operación</p>
      <nav class="space-y-1"><RouterLink v-for="item in navigation" :key="item.to" :to="item.to" class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white" active-class="bg-cyan-400 text-slate-950 shadow-sm hover:bg-cyan-300 hover:text-slate-950"><component :is="item.icon" :size="18" /><span>{{ item.label }}</span></RouterLink></nav>
      <div class="mt-auto rounded-2xl border border-white/10 bg-white/5 p-3"><p class="text-xs font-semibold text-white">Sesión protegida</p><p class="mt-1 text-xs leading-5 text-slate-400">Tus movimientos se registran para mantener la trazabilidad.</p></div>
      <button class="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white" @click="logout"><LogOut :size="18" /><span>Cerrar sesión</span></button>
    </aside>
    <main class="min-h-screen lg:pl-72"><header class="sticky top-0 z-20 flex h-17 items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl lg:px-8"><div><p class="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-700">Botica L y L</p><h1 class="text-sm font-semibold text-slate-800">{{ title }}</h1></div><div class="flex items-center gap-3"><span class="hidden text-right text-xs sm:block"><strong class="block text-slate-700">{{ currentUser.name || 'Operador' }}</strong><span class="capitalize text-slate-400">{{ role || 'cajero' }}</span></span><span class="grid h-9 w-9 place-items-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-800">{{ initials }}</span></div></header><section class="mx-auto max-w-[1600px] p-4 pb-24 sm:p-6 lg:p-8"><slot /></section></main>
    <ChatIaModal :context="route.name" />
    <nav class="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-slate-200 bg-white px-2 py-2 lg:hidden"><RouterLink v-for="item in mobileNavigation" :key="item.to" :to="item.to" class="flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-slate-500" active-class="text-cyan-700"><component :is="item.icon" :size="19" /><span>{{ item.label }}</span></RouterLink></nav>
  </div>
</template>
<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Boxes, CircleDollarSign, ClipboardList, History, LayoutDashboard, LogOut, ShoppingCart, Users } from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';
import api from '../api/axios';
import ChatIaModal from './ChatIaModal.vue';
const route = useRoute(); const router = useRouter();
const { currentUser, role, isAdmin, clearSession } = useAuth();
const homePath = computed(() => isAdmin.value ? '/dashboard' : '/pos');
const navigation = computed(() => [...(isAdmin.value ? [{ to: '/dashboard', label: 'Resumen', icon: LayoutDashboard }] : []), { to: '/pos', label: 'Punto de venta', icon: ShoppingCart }, { to: '/caja', label: 'Caja', icon: CircleDollarSign }, ...(isAdmin.value ? [{ to: '/ventas', label: 'Ventas', icon: ClipboardList }, { to: '/clientes', label: 'Clientes', icon: Users }, { to: '/compras', label: 'Compras', icon: Boxes }, { to: '/inventario', label: 'Inventario', icon: Boxes }, { to: '/actividad', label: 'Actividad', icon: History }, { to: '/usuarios', label: 'Usuarios', icon: Users }] : [])]);
const mobileNavigation = computed(() => navigation.value.slice(0, 5)); const title = computed(() => route.meta.title || 'Panel de operaciones'); const initials = computed(() => (currentUser.value.name || 'OP').split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase());
async function logout() {
  try { await api.post('/logout'); } catch { /* La sesión local se elimina incluso si la red falla. */ }
  clearSession();
  await router.replace({ name: 'login' });
}
</script>
