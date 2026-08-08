# LCexpress v10.6

## Antes de publicar esta versión
1. En Supabase > SQL Editor ejecutar `SQL_MIGRACION_v10_6.sql`.
2. En PowerSync > Sync Streams reemplazar por `SYNC_STREAMS.yaml` y hacer Save and Deploy.
3. En Supabase > Edge Functions crear/desplegar `enviar-pedido` usando `supabase/functions/enviar-pedido/index.ts`.
4. Configurar el secreto `RESEND_API_KEY`. Para producción, verificar un dominio en Resend y configurar `PEDIDOS_FROM_EMAIL`, por ejemplo `LCexpress <pedidos@luichrist.com>`.
5. Después subir la app a GitHub. Cloudflare la desplegará automáticamente.

## Cambios
- Clientes: dirección, teléfono 2, correo y observación.
- GPS: botón directo para abrir coordenadas en Google Maps.
- Pedido: vendedor por cada línea. Por defecto usa el usuario logueado y puede cambiarse.
- Reporte PDF: ventas por vendedor/ítem.
- PDF de pedido incluye dirección del cliente, pero no muestra vendedor por ítem.
- Precio de pedido usa teclado decimal en móvil y formato 1.00 / 10.00 / 1,000.00.
- Categoría, caja y maleta son selectores editables y buscables mediante `datalist`.
- Correo automático del PDF al terminar pedido, con destino editable en Configuración. Si está offline queda pendiente para reintento.
