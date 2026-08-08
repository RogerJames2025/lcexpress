-- LCexpress v10.6.1 - Migración de clientes y vendedor por ítem

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS direccion TEXT,
  ADD COLUMN IF NOT EXISTS telefono2 TEXT,
  ADD COLUMN IF NOT EXISTS correo TEXT,
  ADD COLUMN IF NOT EXISTS observacion TEXT;

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS cliente_direccion TEXT,
  ADD COLUMN IF NOT EXISTS cliente_telefono2 TEXT,
  ADD COLUMN IF NOT EXISTS cliente_correo TEXT;

ALTER TABLE public.pedido_detalle
  ADD COLUMN IF NOT EXISTS vendedor_id UUID,
  ADD COLUMN IF NOT EXISTS vendedor_nombre TEXT;

CREATE INDEX IF NOT EXISTS idx_pedido_detalle_vendedor_id
ON public.pedido_detalle(vendedor_id);
