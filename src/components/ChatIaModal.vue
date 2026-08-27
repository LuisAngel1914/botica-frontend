<template>
  <div class="fixed bottom-5 right-5 z-50">
    <!-- Botón Flotante -->
    <button 
      @click="abierto = !abierto" 
      class="bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-105"
      title="Asistente Farmacéutico IA"
    >
      <span v-if="!abierto" class="text-xl">🤖</span>
      <span v-else class="text-xl font-bold">✕</span>
    </button>

    <!-- Ventana del Chat -->
    <div 
      v-if="abierto" 
      class="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden text-xs sm:text-sm h-[450px]"
    >
      <!-- Cabecera -->
      <div class="bg-blue-600 text-white p-3 flex justify-between items-center shadow-sm">
        <div class="flex items-center gap-2">
          <span class="text-lg">🤖</span>
          <div>
            <p class="font-bold text-sm">Asistente Farmacéutico IA</p>
            <p class="text-[10px] text-blue-100">Consulta equivalentes, dosis y stock</p>
          </div>
        </div>
        <button @click="abierto = false" class="text-white hover:text-gray-200 text-sm font-bold">✕</button>
      </div>

      <!-- Lista de Mensajes -->
      <div ref="chatBox" class="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50">
        <div 
          v-for="(msg, index) in mensajes" 
          :key="index"
          :class="msg.rol === 'user' ? 'justify-end' : 'justify-start'"
          class="flex"
        >
          <div 
            :class="msg.rol === 'user' ? 'bg-blue-600 text-white rounded-l-xl rounded-tr-xl' : 'bg-white text-gray-800 border border-gray-200 rounded-r-xl rounded-tl-xl shadow-sm'"
            class="max-w-[85%] p-2.5 whitespace-pre-line leading-relaxed"
          >
            {{ msg.texto }}
          </div>
        </div>

        <div v-if="cargando" class="flex justify-start">
          <div class="bg-white border border-gray-200 p-2.5 rounded-r-xl rounded-tl-xl text-gray-400 animate-pulse italic flex items-center gap-2">
            <span>🤖</span> Consultando a la IA...
          </div>
        </div>
      </div>

      <!-- Input de Texto -->
      <div class="p-2 bg-white border-t border-gray-200 flex gap-1.5">
        <input 
          v-model="nuevoMensaje" 
          @keyup.enter="enviarMensaje"
          type="text" 
          placeholder="Ej: ¿Qué alternativa hay para Paracetamol 500mg?"
          class="flex-1 p-2 border border-gray-300 rounded-lg outline-none text-xs focus:border-blue-500"
          :disabled="cargando"
        />
        <button 
          @click="enviarMensaje" 
          :disabled="cargando || !nuevoMensaje.trim()"
          class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg font-bold text-xs shadow transition"
        >
          Enviar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import api from '../api/axios';

const abierto = ref(false);
const cargando = ref(false);
const nuevoMensaje = ref('');
const chatBox = ref(null);

const mensajes = ref([
  { rol: 'ia', texto: '¡Hola! Soy tu asistente farmacéutico. Pregúntame sobre equivalentes de medicamentos, recetas o productos del sistema.' }
]);

const scrollToBottom = async () => {
  await nextTick();
  if (chatBox.value) {
    chatBox.value.scrollTop = chatBox.value.scrollHeight;
  }
};

const enviarMensaje = async () => {
  const txt = nuevoMensaje.value.trim();
  if (!txt || cargando.value) return;

  mensajes.value.push({ rol: 'user', texto: txt });
  nuevoMensaje.value = '';
  cargando.value = true;
  await scrollToBottom();

  try {
    // Al usar '/chat', axios lo combina correctamente con el baseURL convirtiéndolo en 'https://miapp.alwaysdata.net/api/chat'
    const res = await api.post('/chat', { mensaje: txt });
    mensajes.value.push({ rol: 'ia', texto: res.data.respuesta });
  } catch (err) {
    console.error('Error al consultar chat:', err);
    mensajes.value.push({ 
      rol: 'ia', 
      texto: '⚠️ Ocurrió un error al consultar con el asistente. Intenta de nuevo.' 
    });
  } finally {
    cargando.value = false;
    await scrollToBottom();
  }
};
</script>