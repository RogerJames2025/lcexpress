# LCexpress 10.11.2 — revisión del ZIP recibido (17 noviembre 2026)

## Hallazgo corregido

El error de la interfaz al elegir cliente, `no such column: rowid`, procede de consultas sobre tablas locales PowerSync (`lc_cola_local` y `lc_migracion_local`) que hacen `ORDER BY rowid`. Las tablas localOnly no garantizan esa columna. Se sustituyó por `ORDER BY id`, columna declarada por PowerSync. **No se eliminan ni modifican datos del dispositivo mediante esta corrección**.

Archivos corregidos: `src/lab18.js` (2 consultas) y `src/migracion23.js` (1 consulta). Prueba añadida: `scripts/test-sqlite-local112.mjs`.

## Ruta R00046

El ZIP recibido ya contiene el ajuste de `src/ruta112.js` y `src/ruta-dependencias112.js` para conservar una ruta oficial aunque otro dispositivo tenga una apertura rechazada. Se conservaron esos cambios.

## Publicación

Subir **el contenido del directorio `lcexpress-main/`** al nivel raíz del repositorio `RogerJames2025/lcexpress` (no subir la carpeta contenedora como subcarpeta). No cargar SQL de migración, no ejecutar scripts SQL ni borrar datos locales. Confirmar el despliegue Ready en Cloudflare y volver a abrir la app.

## Validación y límites

Se realizaron comprobaciones de sintaxis y pruebas estáticas de código, pruebas de ruta y de integridad de referencias. **No se pudo realizar una compilación completa de Vite ni probar el dispositivo real**, porque el ZIP no incluye `package-lock.json` ni `node_modules`, y las dependencias no estaban disponibles localmente. No es posible garantizar que no existan otros fallos en producción.

`ORDER BY id` ofrece orden estable, pero no garantiza orden cronológico de operaciones antiguas; no equivale al orden físico `rowid`. Ante colas antiguas de pedidos con varias revisiones, revisar cuidadosamente antes de reenviar; las validaciones del servidor siguen siendo indispensables.

No borrar caché/almacenamiento, no reinstalar la PWA, no cerrar ni reabrir la ruta R00046 como parte de esta actualización. Verificar selección de cliente, crear pedido de prueba controlado y confirmar recepción oficial antes de uso masivo.
