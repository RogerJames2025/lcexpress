# LCexpress v10.10.0 — concurrencia, inventario colaborativo y búsqueda inteligente

Esta versión parte de v10.9.9 y conserva sus funciones existentes.

## Cambios principales
- Pedidos simultáneos: el guardado/cobro final requiere Internet y se realiza mediante RPC transaccional en Supabase. Los productos involucrados se bloquean por fila, se valida la existencia real y se descuenta de forma atómica para evitar vender dos veces las últimas unidades.
- Anulación de pedidos: la reintegración de existencias también se realiza en servidor de forma transaccional.
- Toma física colaborativa por PRODUCTO, no por caja/maleta. Varios dispositivos agregan aportes parciales del mismo producto y LCexpress suma automáticamente el total consolidado.
- Cada aporte conserva usuario, dispositivo y fecha. Cada dispositivo puede deshacer su último aporte sin borrar el trabajo de los demás.
- El último conteo de la pantalla principal sigue leyendo el total consolidado de la última toma ACEPTADA.
- El inicio y aceptación de una toma física requieren Internet. El conteo de una toma ya abierta puede registrarse localmente y sincronizarse, pero antes de aceptar se exige que el dispositivo autorizador tenga 0 cambios pendientes.
- Búsqueda inteligente normalizada para productos y clientes: acentos, espacios, guiones, teléfonos, palabras en distinto orden y errores ortográficos limitados.
- Código de producto normalizado. La app impide crear un nuevo código que duplique otro existente y el escáner no selecciona arbitrariamente si encuentra un código ambiguo.
- No se cambia automáticamente ningún código histórico duplicado. El SQL incluye consultas de diagnóstico, incluida `7453038478861`.

## Instalación — orden obligatorio
1. En la versión actual, comprobar `Estado nube -> Cambios pendientes: 0`.
2. Ejecutar `SQL_MIGRACION_v10_10_0.sql` en Supabase.
3. Revisar al final del resultado las consultas de códigos duplicados. Son de solo lectura. No cambiar códigos todavía sin confirmar físicamente las etiquetas.
4. En PowerSync, reemplazar/actualizar Sync Streams con `SYNC_STREAMS.yaml` y pulsar **Save** y **Deploy**. La tabla nueva es `inventario_aportes`.
5. Subir/desplegar los archivos de v10.10.0 en GitHub/Cloudflare.
6. Abrir la app una vez con Internet y comprobar `Versión v10.10.0`, `PowerSync Conectado` y `Cambios pendientes: 0`.

## Importante
- No cambiar `dbFilename`; continúa siendo `lcexpress-v10.sqlite`.
- No borrar caché/datos de navegador ni `ps_crud` si existen cambios pendientes.
- Caja, maleta y cantidad en maleta siguen siendo referencias operativas y NO participan en el total del conteo físico.
- Para garantizar inventario concurrente entre varios teléfonos, el cobro/guardado final del pedido necesita Internet. Sin un servidor común no es posible garantizar que dos dispositivos totalmente desconectados no vendan las mismas últimas unidades.
