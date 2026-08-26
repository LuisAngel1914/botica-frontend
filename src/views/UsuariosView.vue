<template>
  <div class="min-h-screen bg-gray-100 font-sans p-4 sm:p-6">
    <div class="max-w-7xl mx-auto space-y-6">
      
      <!-- Header -->
      <div class="bg-white p-5 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-gray-100">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
            👥 Gestión de Personal y Usuarios
          </h1>
          <p class="text-xs sm:text-sm text-gray-500 mt-1">
            Administra los accesos de cajeros y administradores del sistema
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button 
            @click="mostrarModal = true" 
            class="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-4 py-2 rounded-lg font-semibold shadow transition"
          >
            + Registrar Nuevo Usuario
          </button>
          <router-link 
            to="/pos" 
            class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm px-4 py-2 rounded-lg font-semibold transition"
          >
            ← Volver al POS
          </router-link>
        </div>
      </div>

      <!-- Tabla de Usuarios -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th class="p-4">Nombre / Usuario</th>
                <th class="p-4">Correo Electrónico</th>
                <th class="p-4 text-center">Rol</th>
                <th class="p-4 text-center">Estado</th>
                <th class="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="user in usuarios" :key="user.id" class="hover:bg-gray-50/50 transition">
                <td class="p-4 font-bold text-gray-800">{{ user.name }}</td>
                <td class="p-4 text-gray-600">{{ user.email }}</td>
                <td class="p-4 text-center">
                  <span 
                    :class="user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
                    class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase"
                  >
                    {{ user.role }}
                  </span>
                </td>
                <td class="p-4 text-center">
                  <span 
                    :class="user.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                    class="px-2.5 py-1 rounded-full text-[11px] font-bold"
                  >
                    {{ user.activo ? 'Activo' : 'Inactivo (Dado de baja)' }}
                  </span>
                </td>
                <td class="p-4 text-right">
                  <button 
                    @click="toggleEstado(user)" 
                    :class="user.activo ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-green-50 hover:bg-green-100 text-green-600'"
                    class="px-3 py-1 rounded-lg text-xs font-semibold transition"
                  >
                    {{ user.activo ? 'Dar de baja' : 'Reactivar' }}
                  </button>
                </td>
              </tr>
              <tr v-if="usuarios.length === 0">
                <td colspan="5" class="text-center py-8 text-gray-400">Cargando usuarios...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- Modal Formulario Nuevo Usuario -->
    <div v-if="mostrarModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div class="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
        <h2 class="text-lg font-bold text-gray-800">Registrar Nuevo Personal</h2>
        
        <form @submit.prevent="guardarUsuario" class="space-y-3">
          <div>
            <label class="text-xs font-bold text-gray-600 block mb-1">Nombre Completo</label>
            <input v-model="form.name" type="text" required class="w-full border p-2 rounded-lg text-sm focus:outline-blue-500" placeholder="Ej: María Delgado">
          </div>

          <div>
            <label class="text-xs font-bold text-gray-600 block mb-1">Correo Electrónico (Login)</label>
            <input v-model="form.email" type="email" required class="w-full border p-2 rounded-lg text-sm focus:outline-blue-500" placeholder="maria@botica.com">
          </div>

          <div>
            <label class="text-xs font-bold text-gray-600 block mb-1">Contraseña</label>
            <input v-model="form.password" type="password" required class="w-full border p-2 rounded-lg text-sm focus:outline-blue-500" placeholder="••••••••">
          </div>

          <div>
            <label class="text-xs font-bold text-gray-600 block mb-1">Rol de Usuario</label>
            <select v-model="form.role" class="w-full border p-2 rounded-lg text-sm focus:outline-blue-500">
              <option value="cajero">Cajero / Vendedor</option>
              <option value="admin">Administrador (Acceso total)</option>
            </select>
          </div>

          <div class="flex justify-end gap-2 pt-3">
            <button type="button" @click="mostrarModal = false" class="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg">
              Cancelar
            </button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow hover:bg-blue-700">
              Guardar Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api/axios';

const usuarios = ref([]);
const mostrarModal = ref(false);
const form = ref({
  name: '',
  email: '',
  password: '',
  role: 'cajero'
});

const cargarUsuarios = async () => {
  try {
    const res = await api.get('/usuarios');
    usuarios.value = res.data;
  } catch (err) {
    console.error('Error al cargar usuarios:', err);
  }
};

const guardarUsuario = async () => {
  try {
    await api.post('/usuarios', form.value);
    mostrarModal.value = false;
    form.value = { name: '', email: '', password: '', role: 'cajero' };
    cargarUsuarios();
  } catch (err) {
    alert(err.response?.data?.message || 'Error al guardar usuario');
  }
};

const toggleEstado = async (user) => {
  try {
    await api.patch(`/usuarios/${user.id}/toggle`);
    cargarUsuarios();
  } catch (err) {
    console.error('Error al cambiar estado:', err);
  }
};

onMounted(() => {
  cargarUsuarios();
});
</script>