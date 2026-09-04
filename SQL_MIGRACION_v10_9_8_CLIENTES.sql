-- LCexpress v10.9.8
-- Ejecutar en Supabase ANTES de desplegar v10.9.8.
BEGIN;
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS tipo_comercio text,
  ADD COLUMN IF NOT EXISTS no_visitar boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS motivo_no_visitar text;
ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_tipo_comercio_check;
ALTER TABLE public.clientes ADD CONSTRAINT clientes_tipo_comercio_check CHECK (
  tipo_comercio IS NULL OR tipo_comercio='' OR
  tipo_comercio IN ('BARBERIA','SALON','NAILS','LASHES','MASAJES','ACADEMIA','SUPPLY','PUBLICO')
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_inventarios_una_toma_activa
ON public.inventarios ((1))
WHERE estado IN ('EN_CONTEO','PENDIENTE_AUTORIZACION');
COMMIT;

SELECT column_name,data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='clientes'
AND column_name IN ('tipo_comercio','no_visitar','motivo_no_visitar')
ORDER BY column_name;
