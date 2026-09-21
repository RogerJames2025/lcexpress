# LCexpress v10.10.2

Corrección del cobro atómico de v10.10.1.

## Error corregido
`column "modificaciones" is of type jsonb but expression is of type text`

La función `public.lc_guardar_pedido_atomico` ahora conserva `modificaciones` como JSONB mediante:

```sql
COALESCE(p_pedido->'modificaciones','[]'::jsonb)
```

## Instalación desde v10.10.1
1. Ejecutar en Supabase `SQL_FIX_v10_10_2_COBRO_JSONB.sql`.
2. Volver al pedido que quedó abierto y cobrarlo de nuevo.
3. Desplegar esta v10.10.2 para que la versión visible y caché queden actualizadas.

No requiere cambios adicionales en PowerSync Sync Streams. No borra ni reinicia el inventario.
