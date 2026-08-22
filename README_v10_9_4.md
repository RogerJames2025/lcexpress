# LCexpress v10.9.4

## Último conteo físico en pantalla principal
Se agregó la columna **Último conteo físico** inmediatamente antes de **Cant.**.
- Muestra la última cantidad realmente digitada durante una toma física para ese producto.
- También muestra fecha/hora del conteo.
- Se actualiza cuando se realiza un nuevo conteo físico, incluso antes de que cambie la existencia oficial.
- **Cant.** continúa siendo la existencia oficial actual y no se reemplaza por esta columna.

## Redondeo de pedidos
El precio unitario conserva hasta 4 decimales.

Los cálculos usan primero el precio completo de 4 decimales y luego el subtotal de cada línea se redondea a 2 decimales:
- residuo 0.0050 o superior: sube un centavo;
- residuo 0.0049 o inferior: no sube.

Ejemplo:
- 2 × 1.2345 = 2.4690 → 2.47
- 2 × 1.2324 = 2.4648 → 2.46

El total del pedido es la suma de los subtotales redondeados, y el mismo valor se usa en cobro, historial y PDF.

No requiere SQL ni cambios de PowerSync.
