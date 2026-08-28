-- LCexpress v10.9.6 - Estados canónicos de inventario
-- Ejecutar DESPUÉS de que PowerSync muestre 0 cambios pendientes.
-- Convierte cualquier CANCELADO temporal en ANULADO y vuelve a dejar
-- solamente los cuatro estados históricos válidos.

BEGIN;

UPDATE public.inventarios
SET estado = 'ANULADO',
    actualizado = now()
WHERE estado = 'CANCELADO';

ALTER TABLE public.inventarios
DROP CONSTRAINT IF EXISTS inventarios_estado_check;

ALTER TABLE public.inventarios
ADD CONSTRAINT inventarios_estado_check
CHECK (
  estado IN (
    'EN_CONTEO',
    'PENDIENTE_AUTORIZACION',
    'ACEPTADO',
    'ANULADO'
  )
);

COMMIT;

SELECT estado, COUNT(*) AS cantidad
FROM public.inventarios
GROUP BY estado
ORDER BY estado;
