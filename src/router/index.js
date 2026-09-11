import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const routes = [
  { path: '/', name: 'login', component: () => import('../views/LoginView.vue'), meta: { public: true, title: 'Iniciar sesión' } },
  { path: '/pos', name: 'pos', component: () => import('../views/PosView.vue'), meta: { requiresAuth: true, title: 'Punto de venta' } },
  { path: '/ventas', name: 'ventas', component: () => import('../views/VentasView.vue'), meta: { requiresAuth: true, title: 'Historial de ventas' } },
  { path: '/caja', name: 'caja', component: () => import('../views/CajaView.vue'), meta: { requiresAuth: true, title: 'Control de caja' } },
  { path: '/compras', name: 'compras', component: () => import('../views/ComprasView.vue'), meta: { requiresAuth: true, requiresAdmin: true, title: 'Proveedores y compras' } },
  { path: '/clientes', name: 'clientes', component: () => import('../views/ClientesView.vue'), meta: { requiresAuth: true, requiresAdmin: true, title: 'Clientes' } },
  { path: '/inventario', name: 'inventario', component: () => import('../views/InventarioView.vue'), meta: { requiresAuth: true, requiresAdmin: true, title: 'Inventario' } },
  { path: '/reportes', name: 'reportes', component: () => import('../views/ReportesView.vue'), meta: { requiresAuth: true, requiresAdmin: true, title: 'Reportes' } },
  { path: '/actividad', name: 'actividad', component: () => import('../views/ActividadView.vue'), meta: { requiresAuth: true, requiresAdmin: true, title: 'Historial de actividad' } },
  { path: '/usuarios', name: 'usuarios', component: () => import('../views/UsuariosView.vue'), meta: { requiresAuth: true, requiresAdmin: true, title: 'Usuarios' } },
  { path: '/:pathMatch(.*)*', redirect: '/pos' },
];

const router = createRouter({ history: createWebHistory(), routes });
router.beforeEach((to) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (to.meta.requiresAuth && !isAuthenticated.value) return { name: 'login' };
  if (to.name === 'login' && isAuthenticated.value) return { name: 'pos' };
  if (to.meta.requiresAdmin && !isAdmin.value) return { name: 'pos', query: { notice: 'restricted' } };
});
router.afterEach((to) => { document.title = (to.meta.title || 'Botica Operations') + ' · Botica'; });
export default router;