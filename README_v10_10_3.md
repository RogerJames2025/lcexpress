# LCexpress v10.10.3

Corrección del RPC de cobro atómico revisada contra los tipos reales de Supabase.

- `pedidos.modificaciones`: JSONB.
- `pedido_detalle.vendedor_id`: UUID mediante cast explícito.
- Se conservaron los casts explícitos de numeric, timestamptz, boolean y smallint/integer compatibles.
- No borra ni reinicia inventario, pedidos, clientes o rutas.

## Aplicación inmediata
Ejecutar `SQL_FIX_v10_10_3_COBRO_TIPOS.sql` en Supabase SQL Editor. No requiere cambiar PowerSync Sync Streams.
