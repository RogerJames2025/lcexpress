# LCexpress v10.9.2
- Corrige el bloque de forma de pago que aparecía como `${...}` al modificar un pedido.
- Hace robusta la acción Ver para pedidos modificados/sincronizados, aceptando `items` y `modificaciones` tanto como arrays como JSON serializado.
- Hace robusta la edición del mismo pedido.
- Conserva el cobro mixto y el indicador F/CCF de v10.9.1.
- No requiere SQL ni cambios en PowerSync.
