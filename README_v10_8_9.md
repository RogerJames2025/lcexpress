# LCexpress v10.8.9 — precios de referencia de 2/4 decimales

- Precio de referencia admite hasta 4 decimales.
- Si se guarda con 1–2 decimales, se muestra con 2: `1.00`, `10.25`, `1,000.50`.
- Si se guarda con 3–4 decimales, se conserva como precio de 4 decimales: `1.2340`, `10.1234`, `1,000.5678`.
- El pedido toma el precio de referencia del producto y conserva si ese precio usa 2 o 4 decimales.
- Subtotales y total del pedido se calculan internamente en diezmilésimas para evitar redondear cada línea a 2 decimales.
- Si cualquier ítem del pedido usa 4 decimales, el total del pedido se presenta con 4 decimales.
- PDF, vista del pedido e historial conservan la precisión correspondiente.
- No se cambió inventario, rutas, anulación, sincronización, GPS ni restauración protegida de v10.8.8.

## Instalación
1. Ejecutar `SQL_MIGRACION_v10_8_9_PRECIOS_4_DECIMALES.sql` en Supabase SQL Editor.
2. En PowerSync Sync Streams, hacer Save and Deploy para refrescar el esquema.
3. Subir todos los archivos de esta versión a GitHub y esperar el despliegue de Cloudflare.
4. Actualizar LCexpress en cada dispositivo y comprobar `v10.8.9`.
