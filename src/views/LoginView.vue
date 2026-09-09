<template>
  <main class="grid min-h-screen bg-slate-950 lg:grid-cols-2">
    <section class="relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#155e75_0,_transparent_45%),radial-gradient(circle_at_bottom_right,_#0e7490_0,_transparent_35%)] opacity-80" />
      <div class="relative flex items-center gap-3 text-white"><span class="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400 text-lg font-black text-slate-950">B</span><div><strong class="block">Botica Operations</strong><span class="text-sm text-cyan-100">Ventas con precisión, siempre.</span></div></div>
      <div class="relative max-w-md"><p class="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Gestión comercial</p><h1 class="text-5xl font-bold leading-tight text-white">Tu operación diaria, bajo control.</h1><p class="mt-6 text-lg leading-8 text-slate-300">Inventario, ventas, caja y reportes en un solo espacio de trabajo diseñado para farmacia.</p></div>
      <p class="relative text-sm text-slate-400">© {{ year }} Botica Operations</p>
    </section>

    <section class="flex items-center justify-center bg-slate-50 p-5 sm:p-8">
      <div class="w-full max-w-md">
        <div class="mb-8 lg:hidden"><div class="flex items-center gap-3"><span class="grid h-10 w-10 place-items-center rounded-xl bg-cyan-700 font-black text-white">B</span><strong class="text-slate-900">Botica Operations</strong></div></div>
        <div class="app-card p-6 sm:p-8">
          <div class="mb-7"><p class="text-sm font-medium text-cyan-700">Bienvenido</p><h2 class="mt-1 text-2xl font-bold tracking-tight text-slate-900">Ingresa a tu cuenta</h2><p class="mt-2 text-sm text-slate-500">Usa tus credenciales de operador o administrador.</p></div>
          <form class="space-y-5" @submit.prevent="handleLogin">
            <div><label class="field-label" for="email">Correo electrónico</label><div class="relative"><Mail class="pointer-events-none absolute left-3 top-3 text-slate-400" :size="18" /><input id="email" v-model.trim="email" class="field-control pl-10" type="email" autocomplete="email" required placeholder="nombre@botica.com" /></div></div>
            <div><label class="field-label" for="password">Contraseña</label><div class="relative"><LockKeyhole class="pointer-events-none absolute left-3 top-3 text-slate-400" :size="18" /><input id="password" v-model="password" class="field-control pl-10 pr-11" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" required placeholder="Ingresa tu contraseña" /><button class="absolute right-2 top-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" type="button" :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" @click="showPassword = !showPassword"><EyeOff v-if="showPassword" :size="18" /><Eye v-else :size="18" /></button></div></div>
            <p v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{{ error }}</p>
            <button class="btn btn-primary w-full" type="submit" :disabled="loading"><LoaderCircle v-if="loading" class="animate-spin" :size="18" />{{ loading ? 'Validando acceso…' : 'Iniciar sesión' }}</button>
          </form>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue';
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import api from '../api/axios';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { setSession } = useAuth();
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const showPassword = ref(false);
const year = new Date().getFullYear();

async function handleLogin() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await api.post('/login', { email: email.value, password: password.value });
    setSession({ token: data.access_token || data.token, user: data.user });
    await router.replace({ name: 'pos' });
  } catch (err) {
    error.value = err.response?.data?.message || 'No pudimos iniciar sesión. Verifica tus credenciales e inténtalo de nuevo.';
  } finally {
    loading.value = false;
  }
}
</script>
