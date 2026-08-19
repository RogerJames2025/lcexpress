-- LCexpress v10.8.9 - precisión de precio de referencia
-- Conserva el valor NUMERIC existente y añade únicamente la preferencia visual 2/4 decimales.
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS precio_decimales smallint NOT NULL DEFAULT 2;

ALTER TABLE public.pedido_detalle
  ADD COLUMN IF NOT EXISTS precio_decimales smallint NOT NULL DEFAULT 2;

UPDATE public.productos
SET precio_decimales = CASE
  WHEN precio_decimales = 4 THEN 4
  WHEN round(precio::numeric, 2) <> precio::numeric THEN 4
  ELSE 2
END;

UPDATE public.pedido_detalle
SET precio_decimales = CASE
  WHEN precio_decimales = 4 THEN 4
  WHEN round(precio::numeric, 2) <> precio::numeric THEN 4
  ELSE 2
END;

ALTER TABLE public.productos DROP CONSTRAINT IF EXISTS productos_precio_decimales_check;
ALTER TABLE public.productos
  ADD CONSTRAINT productos_precio_decimales_check CHECK (precio_decimales IN (2,4));

ALTER TABLE public.pedido_detalle DROP CONSTRAINT IF EXISTS pedido_detalle_precio_decimales_check;
ALTER TABLE public.pedido_detalle
  ADD CONSTRAINT pedido_detalle_precio_decimales_check CHECK (precio_decimales IN (2,4));
