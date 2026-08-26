import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import PosView from '../views/PosView.vue';
import VentasView from '../views/VentasView.vue';
import CajaView from '../views/CajaView.vue';
import InventarioView from '../views/InventarioView.vue';
import ReportesView from '../views/ReportesView.vue';
import UsuariosView from '../views/UsuariosView.vue';

const routes = [
  { 
    path: '/', 
    name: 'login', 
    component: LoginView 
  },
  { 
    path: '/pos', 
    name: 'pos', 
    component: PosView, 
    meta: { requiresAuth: true } 
  },
  {
    path: '/ventas',
    name: 'ventas',
    component: VentasView,
    meta: { requiresAuth: true }
  },
  {
    path: '/caja',
    name: 'caja',
    component: CajaView,
    meta: { requiresAuth: true }
  },
  { 
    path: '/inventario', 
    name: 'inventario', 
    component: InventarioView,
    meta: { requiresAuth: true }
  },
  { 
    path: '/reportes', 
    name: 'reportes', 
    component: ReportesView,
    meta: { requiresAuth: true, requiresAdmin: true } // 👈 Protegido solo para Admin
  },
  {
    path: '/usuarios',
    name: 'usuarios',
    component: UsuariosView,
    meta: { requiresAuth: true, requiresAdmin: true } // 👈 Protegido solo para Admin
  },
  { 
    path: '/:pathMatch(.*)*', 
    redirect: '/pos' // 👈 Movido al final para no capturar '/usuarios'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Guard de navegación completo (Autenticación + Roles)
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  // 1. Si la ruta requiere autenticación y no hay token -> Login
  if (to.meta.requiresAuth && !token) {
    return next({ name: 'login' });
  } 

  // 2. Si intenta ir al Login teniendo sesión activa -> POS
  if (to.name === 'login' && token) {
    return next({ name: 'pos' });
  } 

  // 3. Si la ruta es solo para Administradores y el usuario no es 'admin' -> Reorientar al POS
  if (to.meta.requiresAdmin && usuario.role !== 'admin') {
    alert('Acceso restringido: Este módulo requiere permisos de Administrador.');
    return next({ name: 'pos' });
  }

  // 4. Si pasa todas las validaciones, continuar
  next();
});

export default router;