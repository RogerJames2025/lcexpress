-- LCexpress v10.8.0 - Inventarios físicos, movimientos y cobro

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS efectivo_recibido NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cambio NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.configuracion
  ADD COLUMN IF NOT EXISTS inventario_numero BIGINT DEFAULT 1;

ALTER TABLE public.inventario_movimientos
  ADD COLUMN IF NOT EXISTS referencia_id TEXT,
  ADD COLUMN IF NOT EXISTS autorizado_por_id UUID,
  ADD COLUMN IF NOT EXISTS autorizado_por_nombre TEXT,
  ADD COLUMN IF NOT EXISTS origen TEXT DEFAULT 'LCEXPRESS';

CREATE TABLE IF NOT EXISTS public.inventarios (
  id TEXT PRIMARY KEY,
  numero TEXT NOT NULL,
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_cierre TIMESTAMPTZ,
  estado TEXT NOT NULL DEFAULT 'EN_CONTEO' CHECK (estado IN ('EN_CONTEO','PENDIENTE_AUTORIZACION','ACEPTADO','ANULADO')),
  creado_por_id UUID,
  creado_por_nombre TEXT,
  autorizado_por_id UUID,
  autorizado_por_nombre TEXT,
  autorizado_en TIMESTAMPTZ,
  observacion TEXT,
  total_productos NUMERIC DEFAULT 0,
  total_diferencias NUMERIC DEFAULT 0,
  actualizado TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventarios_fecha ON public.inventarios(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_inventarios_estado ON public.inventarios(estado);

CREATE TABLE IF NOT EXISTS public.inventario_detalle (
  id TEXT PRIMARY KEY,
  inventario_id TEXT NOT NULL REFERENCES public.inventarios(id) ON DELETE CASCADE,
  producto_id TEXT REFERENCES public.productos(id),
  codigo TEXT,
  descripcion TEXT,
  inventario_inicial NUMERIC NOT NULL DEFAULT 0,
  entradas NUMERIC NOT NULL DEFAULT 0,
  vendido NUMERIC NOT NULL DEFAULT 0,
  otras_salidas NUMERIC NOT NULL DEFAULT 0,
  esperado NUMERIC NOT NULL DEFAULT 0,
  conteo_fisico NUMERIC,
  diferencia NUMERIC,
  actualizado TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventario_detalle_inv ON public.inventario_detalle(inventario_id);
CREATE INDEX IF NOT EXISTS idx_inventario_detalle_prod ON public.inventario_detalle(producto_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_inventario_producto ON public.inventario_detalle(inventario_id, producto_id);

ALTER TABLE public.inventarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_detalle ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.inventarios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.inventario_detalle TO authenticated;

DROP POLICY IF EXISTS authenticated_all ON public.inventarios;
CREATE POLICY authenticated_all ON public.inventarios
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_all ON public.inventario_detalle;
CREATE POLICY authenticated_all ON public.inventario_detalle
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Asegura permisos de las columnas/tablas ya existentes usadas por la nueva versión.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pedidos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.inventario_movimientos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.configuracion TO authenticated;

-- Agregar las nuevas tablas a la publicación PowerSync solo si todavía no están.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='powersync' AND schemaname='public' AND tablename='inventarios') THEN
    ALTER PUBLICATION powersync ADD TABLE public.inventarios;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='powersync' AND schemaname='public' AND tablename='inventario_detalle') THEN
    ALTER PUBLICATION powersync ADD TABLE public.inventario_detalle;
  END IF;
END $$;
