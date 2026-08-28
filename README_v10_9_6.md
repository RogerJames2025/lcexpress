# LCexpress v10.9.6 — Estado ANULADO

Esta versión corrige la incompatibilidad introducida en v10.9.5:
- La app vuelve a usar `ANULADO`, que es el estado histórico permitido por Supabase.
- Ya no genera nuevos registros `CANCELADO`.
- Un inventario ANULADO no se considera una toma activa.
- Un inventario ANULADO no se vuelve a abrir automáticamente para conteo.
- En Historial aparece como ANULADO.
- Conserva las correcciones de v10.9.5 de toma física y funcionamiento offline.

## Orden de instalación
1. Primero deje que v10.9.5 termine de subir todos sus cambios pendientes con la restricción temporal que permite CANCELADO.
2. Confirme `Cambios pendientes: 0`.
3. Ejecute `SQL_FINAL_v10_9_6_NORMALIZAR_ANULADO.sql`.
4. Suba/despliegue v10.9.6.
5. Abra la app y confirme versión v10.9.6 y 0 cambios pendientes.
