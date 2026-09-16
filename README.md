# Botica L y L

Frontend operativo de farmacia construido con Vue 3, Vite y Tailwind CSS. Se conecta al backend Laravel mediante `VITE_API_BASE_URL` (incluye el prefijo `/api`).

## Desarrollo

```sh
npm ci
npm run dev
```

Configura `VITE_API_BASE_URL` en tu entorno local o en `.env.local`. Usa un backend de pruebas para verificar operaciones de caja, ventas e inventario. Nunca incluyas credenciales en el repositorio.

## Validación

```sh
npm test
npm run build
git diff --check
```

Las pruebas cubren autenticación, permisos y navegación por rol, presentación del asistente, lotes vendibles, diálogos y flujos críticos del POS (stock, recetas, cliente, caja e idempotencia).

## Organización

- `src/style.css`: tokens visuales, controles compartidos, layout y responsive.
- `src/components/ui`: encabezados, avisos, métricas, tablas, imágenes, estados y diálogos nativos.
- `src/components/pos`: catálogo, carrito, detalle del producto y verificación de receta.
- `src/components/AppShell.vue` y `AppNavigation.vue`: navegación adaptable por rol y asistente integrado.
- `src/views`: módulos operativos cargados de forma diferida por el router.
- `src/utils/productPresentation.js`: importes, stock vendible y presentación de vencimientos.
- `docs/redesign-audit.md`: auditoría, decisiones y validación del rediseño.

El backend sigue siendo la autoridad para permisos, validación, precios, caja, asignación de lotes y trazabilidad. La interfaz conserva sus contratos; ocultar una acción no sustituye los permisos del servidor.

## Revisión y despliegue

Los PR ejecutan instalación limpia, pruebas y compilación con Node 22. Vercel genera la vista previa para revisión. La publicación en producción requiere aprobar esa vista previa antes de integrar a `main`.
