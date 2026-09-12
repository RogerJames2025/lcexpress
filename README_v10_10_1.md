# LCexpress v10.10.1

Actualización incremental sobre v10.10.0.

## Mejora: Pendientes → 0 en bloque

La toma física colaborativa sigue funcionando por producto y suma los aportes de todos los dispositivos.

Cuando el equipo ya terminó de sacar y contar TODO el inventario, un ADMIN puede usar **0️⃣ Pendientes → 0**. LCexpress:

1. exige Internet;
2. intenta sincronizar primero el dispositivo;
3. verifica que no queden cambios locales pendientes;
4. muestra cuántos productos no tienen ningún conteo;
5. advierte si aparecen otros dispositivos contando;
6. solicita autorización de ADMIN;
7. pide confirmación explícita;
8. crea un aporte 0 para cada producto todavía pendiente;
9. sincroniza esos ceros;
10. deja la toma abierta para que el ADMIN revise el cuadre antes de aceptar.

La acción **NO modifica el inventario oficial por sí sola**. Las existencias solo cambian cuando posteriormente se acepta el inventario final.

## Seguridad

- Un producto con cualquier aporte previo no se toca.
- Los conteos positivos de otros dispositivos no se convierten en cero.
- Si quedan cambios pendientes de sincronización, se bloquea la operación.
- Si la sincronización de los ceros no termina, la app advierte que no se debe aceptar todavía.
- El inventario actual no se borra al instalar esta versión.

## SQL / PowerSync

Esta mejora no agrega tablas ni columnas nuevas respecto a v10.10.0.

- Si todavía vienes de v10.9.9, ejecuta `SQL_MIGRACION_v10_10_0.sql` y despliega `SYNC_STREAMS.yaml` antes de publicar la app.
- Si ya habías instalado correctamente v10.10.0, no necesitas SQL adicional ni cambios nuevos en Sync Streams para v10.10.1.
