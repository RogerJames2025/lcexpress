# LCexpress v10.9.9 — Corrección de compilación y estabilidad

Esta versión incluye todo lo de v10.9.8 y la protección de inventario de v10.9.7.

Correcciones:
- Fuerza `vite build --config ./vite.config.js` para evitar que Cloudflare ignore la configuración de workers.
- `worker.format` queda explícitamente en `es`, requerido por PowerSync con code splitting.
- Dependencias fijadas: `@powersync/web 2.1.1`, `@journeyapps/wa-sqlite 2.0.1`, `vite 7.3.6`.
- Conversión segura de `clientes.no_visitar` de SQLite 0/1 a boolean true/false antes de subir a Supabase.
- El calendario cierra su diálogo antes de abrir el detalle de una ruta para evitar problemas de diálogos superpuestos.
- Versión, Service Worker y caché actualizados a v10.9.9.

Orden de actualización si todavía está en v10.9.6:
1. Confirme `Cambios pendientes: 0`.
2. Ejecute `SQL_MIGRACION_v10_9_8_CLIENTES.sql` en Supabase si aún no lo hizo.
3. PowerSync Sync Streams: Save and Deploy.
4. Suba esta v10.9.9 a GitHub/Cloudflare.
5. En Cloudflare use Build command: `npm run build`.
6. Confirme en los logs que Vite transforma y genera `dist` sin error `worker.format iife`.

No se cambió el nombre de la base local PowerSync (`lcexpress-v10.sqlite`).
