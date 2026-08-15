# LCexpress v10.8.2 — Productos con baja lógica y recuperación de colas

Esta versión incluye todas las funciones de v10.8.1 (conteo físico multiusuario en tiempo real) y corrige el bloqueo de sincronización causado por DELETE físicos de productos que tienen referencias históricas.

## Cambios
- Los DELETE antiguos de `productos` que ya estén en `ps_crud` se convierten automáticamente, durante la subida, en una baja lógica (`eliminado_en`).
- El botón **Eliminar** pasa a llamarse **Desactivar** y ya no genera DELETE físicos.
- Pedidos, movimientos e inventarios históricos conservan la referencia al producto.
- Sync Streams deja de descargar productos desactivados mediante `WHERE eliminado_en IS NULL`.
- No se requiere migración SQL adicional si `productos.eliminado_en` ya existe (es parte del esquema actual).

## Recuperación de PCs con cambios pendientes
1. Publicar v10.8.2 y actualizar la app en la PC afectada.
2. Desplegar el `SYNC_STREAMS.yaml` incluido.
3. Abrir **Más → Estado nube / sincronización** y pulsar **Sincronizar ahora**.
4. Los DELETE de producto que antes daban error de FK se transformarán en baja lógica y la cola continuará con las operaciones posteriores.
5. No borrar `ps_crud`, no limpiar datos del navegador y no reinstalar antes de llegar a 0 pendientes.
