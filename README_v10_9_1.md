# LCexpress v10.9.1 — Historial de pedidos + indicador F / CCF

## Corrección
En v10.9.0 se eliminó accidentalmente `abrirHistorialPedidos()` al sustituir el bloque del cobro.
Los pedidos no se borraron: el botón simplemente no renderizaba ni abría el diálogo.
v10.9.1 restaura esa función.

## Documento solicitado
En el formulario de cobro aparece:
- 🧾 Recibo
- F — Factura / Consumidor final
- CCF — Crédito fiscal

La selección se precarga según el comprobante configurado en el cliente, pero puede ajustarse en el momento del cobro.
Se guarda en el campo `comprobante` que ya existía; no crea tablas ni columnas nuevas.

El indicador F / CCF queda visible en:
- Historial de pedidos
- Ver pedido
- PDF del pedido
- Detalle / historial de ruta
- PDF de la ruta

## Instalación
No requiere SQL nuevo.
1. Subir los archivos a GitHub.
2. Esperar Cloudflare.
3. Actualizar dispositivos a v10.9.1.
