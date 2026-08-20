# LCexpress v10.9.0

Incluye:
- Cobro 💵 efectivo, 💳 tarjeta, 🏦 transferencia y pago mixto.
- Cálculo exacto hasta 4 decimales.
- Error de cobro visible sin cerrar el pedido.
- Bloqueo mientras se guarda para evitar doble clic.
- ID fijo por pedido para que reintentar no cree otro documento.
- Detección de pedido idéntico creado en los últimos 2 minutos; requiere ADMIN para repetirlo.
- Menú Más reorganizado en un centro de opciones por grupos.
- Migración PostgreSQL para conservar realmente 4 decimales en precio/subtotal/total.

Instalación:
1. Ejecutar SQL_MIGRACION_v10_9_0_COBRO_MIXTO.sql en Supabase.
2. PowerSync → Sync Streams → Save and Deploy.
3. Subir archivos a GitHub y esperar Cloudflare.
4. Actualizar dispositivos a v10.9.0.
