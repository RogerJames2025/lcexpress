# LCexpress v10.8.0

## Nuevas funciones

- Inventario físico con inventario inicial, movimientos, ventas, esperado, conteo físico y diferencia.
- Cualquier usuario puede hacer el conteo; el cuadre final exige contraseña de un ADMIN activo.
- La aprobación requiere Internet porque la contraseña se valida directamente contra Supabase Auth y nunca se guarda en LCexpress.
- No se puede iniciar inventario con ruta abierta ni iniciar ruta con inventario abierto.
- Historial de inventarios con vista, PDF tamaño Carta, impresión, compartir y descarga.
- Bloqueo de ventas sin existencia y autorización de administrador para ajustar stock y volver al pedido.
- Registro de ventas, ajustes, entradas y salidas en `inventario_movimientos`.
- Entrada/salida masiva para ADMIN, solo de productos existentes.
- Historial y reporte PDF de movimientos de inventario.
- Formulario de cobro antes de guardar pedido: total, efectivo recibido y cambio, con teclado decimal en móvil.

## Antes de subir a GitHub

1. Ejecutar `SQL_MIGRACION_v10_8_INVENTARIO_COBRO.sql` en Supabase SQL Editor.
2. Reemplazar Sync Streams de PowerSync con `SYNC_STREAMS.yaml` y hacer Save and Deploy.
3. Subir esta versión a GitHub y esperar el despliegue de Cloudflare.
4. En cada dispositivo: Más > Actualizar aplicación.

## Flujo recomendado del inventario

El primer inventario aceptado establece la base. Los siguientes comparan el físico con:

`Esperado = Inventario inicial + Entradas - Vendido - Otras salidas`

Al aceptar, el conteo físico pasa a ser la existencia oficial y el inventario inicial del siguiente ciclo.
