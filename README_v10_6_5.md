# LCexpress v10.6.5 - correlativos offline seguros

## Motivo
Dos dispositivos sin conexión pueden generar el mismo correlativo visible (ej. PED000001). La restricción UNIQUE de `pedidos.numero` bloqueaba todo el lote de PowerSync.

## Solución
1. Ejecutar `SQL_FIX_PEDIDOS_DUPLICADOS_v10_6_5.sql` en Supabase.
2. Los nuevos pedidos se muestran como `PED000001-ABC123`, donde ABC123 proviene del identificador local del dispositivo.
3. `pedidos.id` (UUID) continúa siendo la identidad única real.
4. No se requiere conexión para generar el número.

## Importante
Después de ejecutar el SQL, abra LCexpress y use **Sincronizar ahora** en la PC con cambios pendientes. El lote anteriormente bloqueado podrá continuar.
