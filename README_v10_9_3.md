# LCexpress v10.9.3

Cambio:
- En Historial de pedidos → Ver, ahora aparece el Código de cliente.
- Para pedidos históricos, el código se obtiene de `clientes` mediante `clienteId`.
- Los pedidos nuevos también guardan una copia de `clienteCodigo` para mayor robustez.
- El buscador del historial acepta también el código del cliente.
- No requiere SQL ni cambios en PowerSync.
