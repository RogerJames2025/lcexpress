-- LCexpress v10.9.7
-- Protección de servidor para impedir más de una toma ACTIVA simultánea.
-- NO cambia productos, cantidades, conteos ni movimientos.
--
-- Antes de ejecutarlo, confirme que no existe ninguna toma legítima activa
-- o que existe como máximo una.

CREATE UNIQUE INDEX IF NOT EXISTS ux_inventarios_una_toma_activa
ON public.inventarios ((1))
WHERE estado IN ('EN_CONTEO', 'PENDIENTE_AUTORIZACION');

-- Diagnóstico de correlativos históricos repetidos.
-- En su base ya sabemos que INV000002 se repitió, por eso NO creamos todavía
-- un UNIQUE(numero) hasta normalizar esos registros históricos.
SELECT numero, COUNT(*) AS cantidad
FROM public.inventarios
GROUP BY numero
HAVING COUNT(*) > 1
ORDER BY numero;
