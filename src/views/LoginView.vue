<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <div class="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-100">
      <h2 class="text-2xl font-bold text-center text-blue-600 mb-6">Acceso a Botica POS</h2>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Correo Electrónico</label>
          <input 
            v-model="email" 
            type="email" 
            required 
            class="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm outline-none" 
            placeholder="admin@botica.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Contraseña</label>
          <input 
            v-model="password" 
            type="password" 
            required 
            class="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm outline-none" 
            placeholder="••••••••"
          />
        </div>

        <p v-if="error" class="text-red-500 text-xs sm:text-sm text-center bg-red-50 p-2 rounded border border-red-100">{{ error }}</p>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-2.5 rounded-md transition shadow text-sm disabled:opacity-50"
        >
          {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api/axios';

const email = ref('admin@botica.com');
const password = ref('');
const error = ref('');
const loading = ref(false);
const router = useRouter();

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await api.post('/login', {
      email: email.value,
      password: password.value
    });
    
    // Obtenemos token asegurando compatibilidad con access_token o token
    const token = res.data.access_token || res.data.token;
    
    // Guardamos en localStorage con las claves estándar del sistema
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(res.data.user));
    
    // Redirigimos al POS
    router.push('/pos');
  } catch (err) {
    error.value = err.response?.data?.message || 'Error de credenciales';
  } finally {
    loading.value = false;
  }
};
</script>