-- LCexpress v10.8.3 - Permisos de clientes para usuarios autenticados
-- No elimina clientes ni modifica sus datos.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.clientes TO authenticated;

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lcexpress_clientes_select ON public.clientes;
DROP POLICY IF EXISTS lcexpress_clientes_insert ON public.clientes;
DROP POLICY IF EXISTS lcexpress_clientes_update ON public.clientes;
DROP POLICY IF EXISTS lcexpress_clientes_delete ON public.clientes;

CREATE POLICY lcexpress_clientes_select
ON public.clientes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY lcexpress_clientes_insert
ON public.clientes
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY lcexpress_clientes_update
ON public.clientes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY lcexpress_clientes_delete
ON public.clientes
FOR DELETE
TO authenticated
USING (true);

-- Diagnóstico rápido
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname='public' AND tablename='clientes'
ORDER BY policyname;
