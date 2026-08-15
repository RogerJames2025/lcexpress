-- LCexpress v10.8.1 - Conteo físico multiusuario en tiempo real
-- Ejecutar después de SQL_MIGRACION_v10_8_INVENTARIO_COBRO.sql

ALTER TABLE public.inventario_detalle
  ADD COLUMN IF NOT EXISTS contado_por_id UUID,
  ADD COLUMN IF NOT EXISTS contado_por_nombre TEXT,
  ADD COLUMN IF NOT EXISTS contado_device_id TEXT,
  ADD COLUMN IF NOT EXISTS contado_en TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.inventario_participantes (
  id TEXT PRIMARY KEY,
  inventario_id TEXT NOT NULL REFERENCES public.inventarios(id) ON DELETE CASCADE,
  usuario_id UUID,
  nombre TEXT,
  device_id TEXT,
  ultimo_latido TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  actualizado TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_participantes_inv
  ON public.inventario_participantes(inventario_id);
CREATE INDEX IF NOT EXISTS idx_inv_participantes_usuario
  ON public.inventario_participantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_inv_participantes_latido
  ON public.inventario_participantes(ultimo_latido);

ALTER TABLE public.inventario_participantes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.inventario_participantes TO authenticated;

DROP POLICY IF EXISTS authenticated_all ON public.inventario_participantes;
CREATE POLICY authenticated_all ON public.inventario_participantes
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- inventario_detalle ya tiene RLS/permisos en v10.8.0, pero los reafirmamos para la migración.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.inventario_detalle TO authenticated;

-- Agregar la nueva tabla a la publicación de PowerSync.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='powersync' AND schemaname='public' AND tablename='inventario_participantes'
  ) THEN
    ALTER PUBLICATION powersync ADD TABLE public.inventario_participantes;
  END IF;
END $$;
