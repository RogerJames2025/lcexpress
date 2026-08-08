-- LCexpress v10.6.5
-- Permite que varios dispositivos creen pedidos offline sin bloquear PowerSync.

-- El ID UUID del pedido sigue siendo la clave primaria y la verdadera identidad única.
-- numero pasa a ser una referencia visible indexada, pero no una restricción global.
DROP INDEX IF EXISTS public.idx_pedidos_numero;
CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON public.pedidos(numero);

-- Diagnóstico de números repetidos que ya puedan existir.
SELECT numero, COUNT(*) AS cantidad
FROM public.pedidos
WHERE eliminado_en IS NULL
GROUP BY numero
HAVING COUNT(*) > 1
ORDER BY numero;
