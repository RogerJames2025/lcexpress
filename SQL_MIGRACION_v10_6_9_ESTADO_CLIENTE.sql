-- LCexpress v10.6.9 - Estado comercial del cliente/local
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS estado_comercial TEXT NOT NULL DEFAULT 'ACTIVO',
  ADD COLUMN IF NOT EXISTS fecha_cierre TIMESTAMPTZ;

UPDATE public.clientes
SET estado_comercial = 'ACTIVO'
WHERE estado_comercial IS NULL OR estado_comercial = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clientes_estado_comercial_chk'
  ) THEN
    ALTER TABLE public.clientes
      ADD CONSTRAINT clientes_estado_comercial_chk
      CHECK (estado_comercial IN ('ACTIVO','CERRADO_TEMPORAL','CERRADO_DEFINITIVO'));
  END IF;
END $$;
