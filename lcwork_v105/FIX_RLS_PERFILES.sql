-- Corrige políticas recursivas en perfiles
DROP POLICY IF EXISTS admin_perfiles_select ON public.perfiles;
DROP POLICY IF EXISTS admin_perfiles_update ON public.perfiles;
DROP POLICY IF EXISTS perfil_propio_select ON public.perfiles;

CREATE POLICY perfil_propio_select
ON public.perfiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

GRANT SELECT ON TABLE public.perfiles TO authenticated;
