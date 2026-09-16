# Botica L y L — revisión y propuesta

Base: `main` (`ffa843a`), 16 de septiembre de 2026. Backend revisado en una copia de solo lectura.

## Hallazgos

- POS: encabezados y fotografías cuadradas consumen el espacio de trabajo; tres columnas forzadas dejan tarjetas estrechas junto al carrito. El carrito se pierde debajo del catálogo en móvil. El estado «Terminal lista» no depende de una consulta real.
- Navegación: `slice(0, 5)` oculta módulos administrativos en móvil y no ofrece cierre de sesión. El asistente flotante puede cubrir el cobro.
- Accesibilidad: los diálogos simulados no contienen ni restituyen el foco. Hay inputs sin nombre accesible, controles pequeños y animación sin preferencia de movimiento reducido.
- Consistencia: tablas, avisos y estados vacíos duplicados; métricas definidas dentro de vistas; nombre de marca inconsistente. Imágenes de ficha y reportes usan `object-cover`.
- Código sin referencias: `HelloWorld.vue`, recursos de plantilla y `HistorialVentasView.vue`; dos dependencias de iconos aunque solo se importa `lucide-vue-next`.
- Rendimiento: rutas ya diferidas; baseline de producción: JS principal 164.70 kB (62.26 gzip), CSS 57.59 kB (10.10 gzip). Catálogo completo cargado en memoria; una futura paginación requiere coordinar el contrato de API.
- Fiabilidad de interfaz: el documento del cliente puede cambiar dejando un cliente anterior seleccionado; cantidades decimales llegan a validación del servidor; el estado de caja inicial puede parecer cerrado después de un error de red.

## Contratos backend preservados

Revisados `routes/api.php`, middleware de roles, controladores de venta, producto, caja, compras, devoluciones y asistente, y pruebas de permisos/ventas. Sanctum protege operaciones; `role:admin` restringe gestión. El servidor exige UUID por intento, caja abierta, cantidades enteras, paciente y receta verificada cuando corresponde. Calcula precios, selecciona lotes vigentes por vencimiento, bloquea filas en transacción y conserva asignaciones para devoluciones. El asistente limita intenciones y datos por rol. No es necesario modificar endpoints ni reglas de negocio para el rediseño.

Observación fuera del alcance visual: el resumen de efectivo del asistente suma ventas completadas sin descontar devoluciones como lo hace el módulo de caja; requiere revisión funcional independiente. La auditoría es de código, no una certificación de seguridad ni ejecución del backend.

## Arquitectura visual y orden

1. Tokens navy/teal, controles, badges, estados, imágenes y diálogos accesibles compartidos. Tipografía de sistema, números tabulares y espaciado de 4 px; sin recursos externos ni imágenes inventadas.
2. Shell con navegación agrupada por rol, menú completo móvil, acceso al asistente en cabecera y contenido con ancho útil.
3. POS: búsqueda y filtros sobre catálogo de tarjetas adaptables; carrito de cobro lateral en escritorio; dos paneles con alternancia en móvil, cliente y medios de pago claramente identificados.
4. Login, resumen ejecutivo y módulos administrativos: encabezados, filtros, tablas y detalles comunes. Inventario con filtro de riesgo y lotes; caja con estado verificable y arqueo.
5. Pruebas de interacción y contratos del POS, permisos, estados y diálogos; build, revisión visual móvil/escritorio, PR y CI. Preview de Vercel para aprobación antes de producción.

## Verificación inicial

`npm test`: 5 pruebas aprobadas. `npm run build`: aprobado.

## Resultado implementado

- Sistema visual compartido: tokens navy/teal, encabezados, controles, badges, métricas, tablas desplazables, skeletons, avisos, imágenes y diálogos nativos con Escape, bloqueo mientras se guarda y restitución del foco.
- POS: catálogo adaptable, búsqueda y código de barras, favoritos y recientes, filtros, detalle, receta, carrito lateral y alternancia móvil. Se bloquean intentos simultáneos de cobro desde la consulta de caja; se descartan búsquedas de cliente obsoletas y se limitan cantidades enteras al stock vendible. Se conserva el UUID al reintentar una venta fallida.
- Navegación completa según rol, dashboard accionable, gestión de lotes y riesgos, detalle de compras, filtros de usuarios, caja con estado desconocido ante errores y formularios coherentes entre módulos.
- Asistente integrado en el flujo de la página, cerrado inicialmente y sin superposición sobre el cobro. Se conservan sus intenciones y restricciones operativas.
- Eliminados recursos de plantilla sin referencias, vista antigua de historial y dependencia duplicada de iconos. Se mantienen rutas diferidas.

## Validación del rediseño

- 17 pruebas automatizadas aprobadas: autenticación, presentación del asistente, lotes y recetas, diálogos, rutas por rol, menú móvil y contratos del POS (caja, stock, cantidades, UUID, receta, cliente y reintentos).
- Compilación de producción aprobada. JS principal: aproximadamente 172 kB (65 kB gzip); CSS: aproximadamente 50 kB (10 kB gzip). Sin nuevas dependencias de producción.
- `git diff --check` sin errores.
- Revisión visual local con datos de prueba: login y dashboard en escritorio; POS a 1440, 768, 390 y 320 px; catálogo, carrito, menú administrativo completo, ficha/receta, formulario de producto y asistente. Comprobado que catálogo y carrito no desbordan horizontalmente a 320 px.
- La revisión interactiva usa una API local de fixtures; no registra ventas ni modifica productos en Railway. Los tests verifican contratos y estados de interfaz, no sustituyen una prueba de integración contra una base de datos de staging. El backend solo se auditó; no se modificó.
- La aprobación visual en Vercel y la autorización para producción corresponden al revisor del PR. Este cambio no autoriza el merge automático.
