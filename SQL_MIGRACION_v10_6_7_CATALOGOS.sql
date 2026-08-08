-- LCexpress v10.6.7 - Catálogos mantenibles de productos
-- Ejecutar una sola vez en Supabase > SQL Editor antes de publicar v10.6.7.

CREATE TABLE IF NOT EXISTS public.categorias_producto (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  orden INTEGER NOT NULL DEFAULT 0,
  actualizado TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.cajas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  orden INTEGER NOT NULL DEFAULT 0,
  actualizado TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.maletas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  orden INTEGER NOT NULL DEFAULT 0,
  actualizado TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_categorias_producto_nombre ON public.categorias_producto(nombre);
CREATE INDEX IF NOT EXISTS idx_cajas_nombre ON public.cajas(nombre);
CREATE INDEX IF NOT EXISTS idx_maletas_nombre ON public.maletas(nombre);

ALTER TABLE public.categorias_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maletas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS authenticated_all ON public.categorias_producto;
CREATE POLICY authenticated_all ON public.categorias_producto FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS authenticated_all ON public.cajas;
CREATE POLICY authenticated_all ON public.cajas FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS authenticated_all ON public.maletas;
CREATE POLICY authenticated_all ON public.maletas FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias_producto, public.cajas, public.maletas TO authenticated;
GRANT SELECT ON public.categorias_producto, public.cajas, public.maletas TO powersync_repl;

-- Copiar los valores existentes del inventario a los catálogos, sin alterar productos.
INSERT INTO public.categorias_producto(id,nombre,activo,orden)
SELECT gen_random_uuid()::text, categoria, TRUE, ROW_NUMBER() OVER (ORDER BY categoria)
FROM (SELECT DISTINCT UPPER(TRIM(COALESCE(categoria,'GENERAL'))) categoria FROM public.productos WHERE COALESCE(TRIM(categoria),'') <> '') x
WHERE NOT EXISTS (SELECT 1 FROM public.categorias_producto c WHERE UPPER(TRIM(c.nombre)) = x.categoria);

INSERT INTO public.cajas(id,nombre,activo,orden)
SELECT gen_random_uuid()::text, caja, TRUE, ROW_NUMBER() OVER (ORDER BY caja)
FROM (SELECT DISTINCT UPPER(TRIM(caja)) caja FROM public.productos WHERE COALESCE(TRIM(caja),'') <> '') x
WHERE NOT EXISTS (SELECT 1 FROM public.cajas c WHERE UPPER(TRIM(c.nombre)) = x.caja);

INSERT INTO public.maletas(id,nombre,activo,orden)
SELECT gen_random_uuid()::text, maleta, TRUE, ROW_NUMBER() OVER (ORDER BY maleta)
FROM (SELECT DISTINCT UPPER(TRIM(maleta)) maleta FROM public.productos WHERE COALESCE(TRIM(maleta),'') <> '') x
WHERE NOT EXISTS (SELECT 1 FROM public.maletas m WHERE UPPER(TRIM(m.nombre)) = x.maleta);

-- Agregar las nuevas tablas a la publicación de PowerSync, si todavía no están incluidas.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='powersync' AND schemaname='public' AND tablename='categorias_producto') THEN
    ALTER PUBLICATION powersync ADD TABLE public.categorias_producto;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='powersync' AND schemaname='public' AND tablename='cajas') THEN
    ALTER PUBLICATION powersync ADD TABLE public.cajas;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='powersync' AND schemaname='public' AND tablename='maletas') THEN
    ALTER PUBLICATION powersync ADD TABLE public.maletas;
  END IF;
END $$;
