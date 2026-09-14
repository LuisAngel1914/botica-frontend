import { computed, ref } from 'vue';

const TOKEN_KEY = 'token';
const USER_KEY = 'usuario';
const currentUser = ref(readUser());
const sessionVersion = ref(0);

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || '{}');
  } catch {
    return {};
  }
}

export function useAuth() {
  const isAuthenticated = computed(() => {
    sessionVersion.value;
    return Boolean(localStorage.getItem(TOKEN_KEY));
  });
  const role = computed(() => (currentUser.value.role || currentUser.value.rol || '').toLowerCase());
  const isAdmin = computed(() => ['admin', 'administrador'].includes(role.value));

  function setSession({ token, user }) {
    if (!token) throw new Error('La sesión no contiene un token válido.');
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user || {}));
    currentUser.value = user || {};
    sessionVersion.value += 1;
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    currentUser.value = {};
    sessionVersion.value += 1;
  }

  return { currentUser, isAuthenticated, isAdmin, role, setSession, clearSession };
}
