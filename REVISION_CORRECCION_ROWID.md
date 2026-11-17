# Corrección conservadora de SQLite local — 2026-11-17

Origen: archivo adjunto lcexpress-main (9).zip.

Se encontraron tres consultas `ORDER BY rowid` en tablas locales `lc_cola_local` y `lc_migracion_local`. SQLite no garantiza que `rowid` exista en tablas WITHOUT ROWID o vistas. Se reemplazó por `ORDER BY id`, columna ya usada en filtros y operaciones del mismo código.

Archivos modificados: src/lab18.js (2), src/migracion23.js (1). Ningún cambio en base de datos ni operaciones locales.

ADVERTENCIA: Ordenar por UUID/id no equivale necesariamente al orden de inserción. Antes de operar en producción se debe validar secuencia de operaciones pendientes y comportamiento de sincronización. No se han probado en un navegador conectado a producción ni compilado con dependencias externas.

No borrar almacenamiento del navegador ni datos offline. No cerrar la ruta R00046 para actualizar.
