# LCexpress v10.6.7 — Mantenimiento de Catálogos

## Antes de publicar
1. En Supabase > SQL Editor ejecutar `SQL_MIGRACION_v10_6_7_CATALOGOS.sql`.
2. En PowerSync > Sync Streams reemplazar la configuración por `SYNC_STREAMS.yaml` y pulsar **Save and Deploy**.
3. Subir todo el proyecto a GitHub. Cloudflare compilará/publicará automáticamente.
4. En cada dispositivo usar **Más > Actualizar aplicación** y confirmar que aparezca v10.6.7.

## Nuevo módulo
**Más > Catálogos de productos** (solo ADMIN):
- Categorías
- Cajas
- Maletas

Cada catálogo permite crear, editar, activar/desactivar, eliminar valores no utilizados y fusionar duplicados. Al renombrar o fusionar se actualizan los productos afectados.

Los productos continúan guardando el texto de categoría/caja/maleta para conservar compatibilidad con datos existentes, mientras los catálogos controlan las opciones activas mostradas en los formularios.
