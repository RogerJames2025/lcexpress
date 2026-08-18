-- LCexpress v10.8.7 - Anulación segura de pedidos
-- Conserva correlativo/historial; no elimina documentos.
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'ACTIVO',
  ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT,
  ADD COLUMN IF NOT EXISTS anulado_en TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS anulado_por_id UUID,
  ADD COLUMN IF NOT EXISTS anulado_por_nombre TEXT,
  ADD COLUMN IF NOT EXISTS anulado_autorizado_por_id UUID,
  ADD COLUMN IF NOT EXISTS anulado_autorizado_por_nombre TEXT;

UPDATE public.pedidos SET estado='ACTIVO' WHERE estado IS NULL OR estado='';

CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON public.pedidos(estado);
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pedidos TO authenticated;
