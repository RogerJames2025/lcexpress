# LCexpress v10.8.7 — Anulación segura de pedidos

- Los pedidos se anulan sin borrarse y conservan su correlativo.
- ADMIN puede anular; VENDEDOR requiere contraseña de un ADMIN activo.
- Motivo obligatorio y auditoría de quién solicitó/autorizó.
- Reintegro de existencias en una transacción local atómica.
- Movimiento `ANULACION_PEDIDO` por producto.
- Pedidos anulados no suman a ruta, cliente, ventas por vendedor ni inventario vendido.
- Historial y PDF muestran claramente `ANULADO`.
- Pedidos anulados no pueden editarse ni anularse dos veces.

Ejecute `SQL_MIGRACION_v10_8_7_ANULACION_PEDIDOS.sql` en Supabase antes de publicar la app.
No es necesario cambiar Sync Streams si `pedidos` se sincroniza con `SELECT *`.
