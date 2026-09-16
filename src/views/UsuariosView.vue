<template>
  <div class="space-y-6">
    <PageHeader
      eyebrow="Administración"
      title="Usuarios y accesos"
      description="Gestiona los perfiles que pueden operar en la botica."
    >
      <template #actions
        ><button class="btn btn-primary" @click="openCreate">
          <UserPlus :size="18" />Nuevo usuario
        </button></template
      >
    </PageHeader>
    <InlineNotice :notice="notice" @dismiss="notice = null" />
    <section class="app-card overflow-hidden">
      <div
        class="flex items-center justify-between border-b border-slate-100 p-5"
      >
        <div>
          <p
            class="text-xs font-semibold uppercase tracking-wider text-cyan-700"
          >
            Últimos 30 días
          </p>
          <h2 class="mt-1 text-lg font-bold text-slate-900">
            Rendimiento por responsable
          </h2>
        </div>
        <span class="text-xs text-slate-500"
          >Desde {{ performanceStart || "—" }}</span
        >
      </div>
      <div v-if="performance.length" class="overflow-x-auto">
        <DataTable class="w-full min-w-[680px] text-left text-sm"
          ><thead
            class="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"
          >
            <tr>
              <th scope="col" class="p-4">Responsable</th>
              <th scope="col" class="p-4 text-center">Ventas</th>
              <th scope="col" class="p-4 text-right">Monto vendido</th>
              <th scope="col" class="p-4 text-center">Cierres</th>
              <th scope="col" class="p-4 text-center">Compras recibidas</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="operator in performance" :key="operator.id">
              <td class="p-4 font-bold text-slate-800">
                {{ operator.name
                }}<span
                  class="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                  >{{ operator.role }}</span
                >
              </td>
              <td class="p-4 text-center font-bold">
                {{ operator.ventas_cantidad }}
              </td>
              <td class="p-4 text-right font-black text-emerald-700">
                S/ {{ money(operator.ventas_monto) }}
              </td>
              <td class="p-4 text-center">{{ operator.cierres_cantidad }}</td>
              <td class="p-4 text-center">{{ operator.compras_cantidad }}</td>
            </tr>
          </tbody></DataTable
        >
      </div>
      <div v-else class="p-5 text-sm text-slate-500">
        Aún no hay operaciones en el período.
      </div>
    </section>
    <section class="app-card overflow-hidden">
      <div class="flex flex-wrap items-center gap-3 border-b p-4">
        <div class="mr-auto">
          <h2 class="text-sm font-semibold">Accesos del equipo</h2>
          <p class="mt-1 text-xs text-slate-500">
            Perfiles, permisos y estado de la cuenta.
          </p>
        </div>
        <input
          v-model="userSearch"
          class="field-control sm:!w-64"
          aria-label="Buscar usuario"
          placeholder="Nombre o correo"
        /><select
          v-model="roleFilter"
          class="field-control sm:!w-40"
          aria-label="Filtrar por rol"
        >
          <option value="">Todos los roles</option>
          <option value="admin">Administrador</option>
          <option value="cajero">Cajero</option>
        </select>
      </div>
      <SkeletonLoader v-if="loading" label="Cargando usuarios…" />
      <div v-else-if="filteredUsers.length" class="overflow-x-auto">
        <DataTable class="w-full min-w-160 text-left text-sm"
          ><thead
            class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500"
          >
            <tr>
              <th scope="col" class="p-4">Usuario</th>
              <th scope="col" class="p-4">Correo</th>
              <th scope="col" class="p-4 text-center">Rol</th>
              <th scope="col" class="p-4 text-center">Estado</th>
              <th scope="col" class="p-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="user in filteredUsers"
              :key="user.id"
              class="transition hover:bg-slate-50"
            >
              <td class="p-4">
                <p class="font-semibold text-slate-800">{{ user.name }}</p>
                <p class="mt-1 text-xs text-slate-400">ID #{{ user.id }}</p>
              </td>
              <td class="p-4 text-slate-600">{{ user.email }}</td>
              <td class="p-4 text-center">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-bold"
                  :class="
                    user.role === 'admin'
                      ? 'bg-violet-50 text-violet-700'
                      : 'bg-cyan-50 text-cyan-700'
                  "
                  >{{
                    user.role === "admin" ? "Administrador" : "Cajero"
                  }}</span
                >
              </td>
              <td class="p-4 text-center">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-bold"
                  :class="
                    user.activo
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  "
                  >{{ user.activo ? "Activo" : "Inactivo" }}</span
                >
              </td>
              <td class="p-4 text-right">
                <button
                  class="btn px-3 py-2 text-xs"
                  :class="
                    user.activo
                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  "
                  @click="requestToggle(user)"
                >
                  {{ user.activo ? "Desactivar" : "Reactivar" }}
                </button>
              </td>
            </tr>
          </tbody></DataTable
        >
      </div>
      <EmptyState
        v-else
        icon="users"
        title="Sin usuarios para mostrar"
        description="Cambia los filtros o crea un perfil para el equipo."
      />
    </section>

    <AppDialog
      v-if="showForm"
      :open="true"
      label="Nuevo usuario"
      :busy="saving"
      :error="notice?.type === 'error' ? notice.message : ''"
      @close="showForm = false"
      ><form
        class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        @submit.prevent="saveUser"
      >
        <div class="mb-6">
          <h2 class="text-lg font-bold text-slate-900">Nuevo usuario</h2>
          <p class="mt-1 text-sm text-slate-500">
            Define sus credenciales y nivel de acceso.
          </p>
        </div>
        <div class="space-y-4">
          <div>
            <label class="field-label">Nombre completo</label
            ><input
              v-model.trim="form.name"
              aria-label="Nombre completo"
              class="field-control"
              required
              placeholder="María Delgado"
            />
          </div>
          <div>
            <label class="field-label">Correo electrónico</label
            ><input
              v-model.trim="form.email"
              aria-label="Correo electrónico"
              class="field-control"
              required
              type="email"
              placeholder="maria@botica.com"
            />
          </div>
          <div>
            <label class="field-label">Contraseña</label
            ><input
              v-model="form.password"
              aria-label="Contraseña"
              class="field-control"
              required
              type="password"
              minlength="8"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label class="field-label">Rol</label
            ><select v-model="form.role" aria-label="Rol" class="field-control">
              <option value="cajero">Cajero / vendedor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button
            class="btn btn-secondary"
            type="button"
            @click="showForm = false"
          >
            Cancelar</button
          ><button class="btn btn-primary" :disabled="saving">
            {{ saving ? "Guardando…" : "Crear usuario" }}
          </button>
        </div>
      </form></AppDialog
    >
    <AppDialog
      v-if="userToToggle"
      :open="true"
      label="Cambiar estado del usuario"
      :busy="saving"
      :error="notice?.type === 'error' ? notice.message : ''"
      @close="userToToggle = null"
      ><div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 class="text-lg font-bold text-slate-900">
          {{ userToToggle.activo ? "Desactivar usuario" : "Reactivar usuario" }}
        </h2>
        <p class="mt-2 text-sm text-slate-500">
          ¿Confirmas este cambio para {{ userToToggle.name }}?
        </p>
        <div class="mt-6 flex justify-end gap-3">
          <button class="btn btn-secondary" @click="userToToggle = null">
            Cancelar</button
          ><button
            class="btn"
            :class="
              userToToggle.activo
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            "
            :disabled="saving"
            @click="toggleUser"
          >
            {{ saving ? "Guardando…" : "Confirmar" }}
          </button>
        </div>
      </div></AppDialog
    >
  </div>
</template>
<script setup>
import AppDialog from "../components/ui/AppDialog.vue";
import DataTable from "../components/ui/DataTable.vue";
import { computed, onMounted, ref } from "vue";
import { LoaderCircle, UserPlus, Users } from "lucide-vue-next";
import api from "../api/axios";
import InlineNotice from "../components/ui/InlineNotice.vue";
import PageHeader from "../components/ui/PageHeader.vue";
import EmptyState from "../components/ui/EmptyState.vue";
import SkeletonLoader from "../components/ui/SkeletonLoader.vue";

const users = ref([]),
  performance = ref([]),
  performanceStart = ref(""),
  loading = ref(true),
  saving = ref(false),
  showForm = ref(false),
  userToToggle = ref(null),
  notice = ref(null);
const userSearch = ref(""),
  roleFilter = ref("");
const filteredUsers = computed(() =>
  users.value.filter(
    (user) =>
      (!roleFilter.value || user.role === roleFilter.value) &&
      [user.name, user.email].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(userSearch.value.toLowerCase()),
      ),
  ),
);
const blankForm = () => ({ name: "", email: "", password: "", role: "cajero" });
const form = ref(blankForm());
const money = (value) => Number(value || 0).toFixed(2);
function show(message, type = "success") {
  notice.value = { message, type };
}
async function loadUsers() {
  loading.value = true;
  try {
    const [usersResponse, performanceResponse] = await Promise.all([
      api.get("/usuarios"),
      api.get("/usuarios/resumen-operativo"),
    ]);
    users.value = usersResponse.data.data || usersResponse.data || [];
    performance.value = performanceResponse.data.usuarios || [];
    performanceStart.value = performanceResponse.data.desde || "";
  } catch {
    show("No se pudo cargar la lista de usuarios.", "error");
  } finally {
    loading.value = false;
  }
}
function openCreate() {
  form.value = blankForm();
  showForm.value = true;
}
async function saveUser() {
  saving.value = true;
  try {
    await api.post("/usuarios", form.value);
    showForm.value = false;
    show("Usuario creado correctamente.");
    await loadUsers();
  } catch (error) {
    show(
      error.response?.data?.message || "No fue posible crear el usuario.",
      "error",
    );
  } finally {
    saving.value = false;
  }
}
function requestToggle(user) {
  userToToggle.value = user;
}
async function toggleUser() {
  saving.value = true;
  try {
    await api.patch("/usuarios/" + userToToggle.value.id + "/toggle");
    show(
      userToToggle.value.activo
        ? "Usuario desactivado."
        : "Usuario reactivado.",
    );
    userToToggle.value = null;
    await loadUsers();
  } catch (error) {
    show(
      error.response?.data?.message || "No fue posible actualizar el usuario.",
      "error",
    );
  } finally {
    saving.value = false;
  }
}
onMounted(loadUsers);
</script>
