-- LCexpress v10.9.0 - cobro mixto, precisión monetaria y campos de pago
ALTER TABLE public.productos
  ALTER COLUMN precio TYPE numeric(16,4) USING precio::numeric(16,4);

ALTER TABLE public.pedido_detalle
  ALTER COLUMN precio TYPE numeric(16,4) USING precio::numeric(16,4),
  ALTER COLUMN subtotal TYPE numeric(18,4) USING subtotal::numeric(18,4);

ALTER TABLE public.pedidos
  ALTER COLUMN total TYPE numeric(18,4) USING total::numeric(18,4);

ALTER TABLE public.pedidos
  ALTER COLUMN efectivo_recibido TYPE numeric(18,4) USING COALESCE(efectivo_recibido,0)::numeric(18,4),
  ALTER COLUMN cambio TYPE numeric(18,4) USING COALESCE(cambio,0)::numeric(18,4);

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS forma_pago text NOT NULL DEFAULT 'EFECTIVO',
  ADD COLUMN IF NOT EXISTS pago_efectivo numeric(18,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pago_tarjeta numeric(18,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pago_transferencia numeric(18,4) NOT NULL DEFAULT 0;

UPDATE public.pedidos
SET forma_pago='EFECTIVO', pago_efectivo=total, pago_tarjeta=0, pago_transferencia=0
WHERE COALESCE(pago_efectivo,0)=0 AND COALESCE(pago_tarjeta,0)=0 AND COALESCE(pago_transferencia,0)=0;

ALTER TABLE public.pedidos DROP CONSTRAINT IF EXISTS pedidos_forma_pago_check;
ALTER TABLE public.pedidos ADD CONSTRAINT pedidos_forma_pago_check
CHECK (forma_pago IN ('EFECTIVO','TARJETA','TRANSFERENCIA','MIXTO'));
