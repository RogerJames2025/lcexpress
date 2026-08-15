# LCexpress v10.8.1 — Conteo físico compartido

## Cambios principales

- Una misma toma de inventario puede ser realizada simultáneamente desde varias PCs, Android o iPhone.
- PowerSync mantiene sincronizados `inventario_detalle` e `inventario_participantes`; la interfaz usa watch queries para reflejar cambios de otros dispositivos.
- Al iniciar LCexpress, si existe una toma `EN_CONTEO` o `PENDIENTE_AUTORIZACION`, la app entra automáticamente a esa toma.
- La pantalla muestra quiénes están contando en ese momento. Se considera activo a un participante con latido reciente.
- Cada producto registra el último usuario/dispositivo que modificó su conteo y la hora.
- Conteo físico ahora es un campo de digitación directa, sin flechas. En Android/iPhone solicita teclado numérico mediante `inputmode="numeric"`.
- El conteo se guarda al salir del campo o presionar Enter. Esto evita generar una escritura de nube por cada tecla digitada.
- Si dos usuarios modifican exactamente el mismo producto al mismo tiempo, prevalece la última modificación que llegue a Supabase/PowerSync. La columna “Último conteo” ayuda a identificarlo.

## Instalación

1. Ejecutar `SQL_MIGRACION_v10_8_1_CONTEO_COMPARTIDO.sql` en Supabase SQL Editor.
2. Reemplazar PowerSync Sync Streams por `SYNC_STREAMS.yaml` y hacer Save and Deploy.
3. Subir esta versión a GitHub y esperar el despliegue de Cloudflare.
4. En cada dispositivo usar Más → Actualizar aplicación.

## Nota de consumo

La presencia no hace consultas completas. Cada dispositivo que permanece dentro del conteo actualiza un único registro de presencia aproximadamente cada 45 segundos. Los conteos de productos se escriben solamente al confirmar/salir del campo, no en cada pulsación de teclado.
