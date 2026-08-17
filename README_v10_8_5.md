# LCexpress v10.8.5 — Recuperación FK pedido/movimientos

- Corrige el orden de guardado de pedidos nuevos: primero pedido, luego movimientos de inventario.
- uploadData usa getNextCrudTransaction() para respetar transacciones lógicas y diagnosticar fallos con precisión.
- Recupera automáticamente colas antiguas donde un inventario_movimientos referencia un pedido que todavía no llegó a Supabase: publica primero el encabezado local del pedido y continúa.
- Conserva v10.8.4 y todas las funciones anteriores.
