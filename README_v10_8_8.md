# LCexpress v10.8.8 — Recuperación nube y protección de restauración

## Cambios
- Al volver Internet, LCexpress valida/renueva la sesión Supabase y reconecta PowerSync automáticamente.
- “Sincronizar ahora” muestra el motivo real cuando existe Internet pero no hay sesión de nube válida.
- Estado nube muestra Supabase Auth y disponibilidad del token PowerSync.
- “Restaurar inventario original” pasa a “Restauración de catálogo inicial”, solo ADMIN.
- Requiere contraseña del mismo administrador conectado y escribir RESTAURAR.
- Genera un backup completo antes de reemplazar productos.
- No requiere cambios SQL ni cambios de Sync Streams respecto de v10.8.7.
