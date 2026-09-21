-- LCexpress v10.10.0
-- Conteo físico colaborativo por producto + stock atómico para pedidos + protección de códigos duplicados.
-- EJECUTAR EN SUPABASE ANTES DE PUBLICAR LA v10.10.0.

BEGIN;

-- ============================================================
-- 1) APORTES DE CONTEO FÍSICO
-- Cada fila es una cantidad parcial contada por un dispositivo.
-- El total físico de un producto = SUM(cantidad) de todos los aportes activos.
-- Caja/Maleta NO forman parte del cálculo.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inventario_aportes (
  id TEXT PRIMARY KEY,
  inventario_id TEXT NOT NULL REFERENCES public.inventarios(id) ON DELETE CASCADE,
  producto_id TEXT NOT NULL REFERENCES public.productos(id),
  cantidad NUMERIC NOT NULL CHECK (cantidad >= 0),
  contado_por_id UUID,
  contado_por_nombre TEXT,
  device_id TEXT NOT NULL,
  contado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_inv_aportes_inventario ON public.inventario_aportes(inventario_id);
CREATE INDEX IF NOT EXISTS idx_inv_aportes_producto ON public.inventario_aportes(producto_id);
CREATE INDEX IF NOT EXISTS idx_inv_aportes_dispositivo ON public.inventario_aportes(device_id);

ALTER TABLE public.inventario_aportes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.inventario_aportes TO authenticated;
DROP POLICY IF EXISTS authenticated_all ON public.inventario_aportes;
CREATE POLICY authenticated_all ON public.inventario_aportes
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='powersync' AND schemaname='public' AND tablename='inventario_aportes'
  ) THEN
    ALTER PUBLICATION powersync ADD TABLE public.inventario_aportes;
  END IF;
END $$;

-- Impide que un aporte nuevo entre después de que el administrador ya está cerrando/aceptando la toma.
CREATE OR REPLACE FUNCTION public.lc_validar_aporte_inventario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_estado TEXT;
BEGIN
  SELECT estado INTO v_estado
  FROM public.inventarios
  WHERE id = NEW.inventario_id
  FOR SHARE;

  IF v_estado IS NULL THEN
    RAISE EXCEPTION 'INVENTARIO_NO_EXISTE';
  END IF;
  IF v_estado <> 'EN_CONTEO' THEN
    RAISE EXCEPTION 'INVENTARIO_CERRADO: la toma ya no acepta aportes';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lc_validar_aporte_inventario ON public.inventario_aportes;
CREATE TRIGGER trg_lc_validar_aporte_inventario
BEFORE INSERT OR UPDATE OF cantidad, eliminado_en ON public.inventario_aportes
FOR EACH ROW EXECUTE FUNCTION public.lc_validar_aporte_inventario();

-- ============================================================
-- 2) INICIO ATÓMICO DE TOMA DE INVENTARIO
-- Solo puede existir una toma activa. Si dos dispositivos intentan iniciar,
-- ambos terminan usando la misma toma.
-- ============================================================
CREATE OR REPLACE FUNCTION public.lc_iniciar_inventario_colaborativo(
  p_creado_por_id UUID,
  p_creado_por_nombre TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existente public.inventarios%ROWTYPE;
  v_id TEXT;
  v_numero TEXT;
  v_n BIGINT;
  v_total BIGINT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NO_AUTENTICADO'; END IF;

  PERFORM pg_advisory_xact_lock(hashtext('LCEXPRESS_INVENTARIO_ACTIVO'));

  SELECT * INTO v_existente
  FROM public.inventarios
  WHERE estado IN ('EN_CONTEO','PENDIENTE_AUTORIZACION')
  ORDER BY fecha_inicio DESC
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    RETURN jsonb_build_object('id',v_existente.id,'numero',v_existente.numero,'existente',true);
  END IF;

  INSERT INTO public.configuracion(id, pedido_prefijo, pedido_numero, cliente_numero, ruta_numero, inventario_numero, actualizado)
  VALUES ('principal','PED',1,1,1,1,v_now)
  ON CONFLICT (id) DO NOTHING;

  SELECT GREATEST(COALESCE(inventario_numero,1),1)
    INTO v_n
  FROM public.configuracion
  WHERE id='principal'
  FOR UPDATE;

  LOOP
    v_numero := 'INV' || LPAD(v_n::TEXT,6,'0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.inventarios WHERE numero=v_numero);
    v_n := v_n + 1;
  END LOOP;

  v_id := 'inv' || REPLACE(gen_random_uuid()::TEXT,'-','');
  SELECT COUNT(*) INTO v_total FROM public.productos WHERE eliminado_en IS NULL;

  INSERT INTO public.inventarios(
    id,numero,fecha_inicio,estado,creado_por_id,creado_por_nombre,
    observacion,total_productos,total_diferencias,actualizado
  ) VALUES (
    v_id,v_numero,v_now,'EN_CONTEO',p_creado_por_id,p_creado_por_nombre,
    'Conteo colaborativo por producto v10.10.0',v_total,0,v_now
  );

  -- El esperado se congela con la existencia oficial del servidor al iniciar la toma.
  INSERT INTO public.inventario_detalle(
    id,inventario_id,producto_id,codigo,descripcion,
    inventario_inicial,entradas,vendido,otras_salidas,esperado,
    conteo_fisico,diferencia,actualizado
  )
  SELECT
    v_id || '-' || p.id, v_id, p.id, COALESCE(p.codigo,''), COALESCE(p.descripcion,''),
    COALESCE(p.cantidad,0),0,0,0,COALESCE(p.cantidad,0),
    NULL,NULL,v_now
  FROM public.productos p
  WHERE p.eliminado_en IS NULL;

  UPDATE public.configuracion
  SET inventario_numero=v_n+1, actualizado=v_now
  WHERE id='principal';

  RETURN jsonb_build_object('id',v_id,'numero',v_numero,'existente',false,'productos',v_total);
END;
$$;
GRANT EXECUTE ON FUNCTION public.lc_iniciar_inventario_colaborativo(UUID,TEXT) TO authenticated;

-- ============================================================
-- 3) ACEPTACIÓN ATÓMICA DEL INVENTARIO
-- Suma TODOS los aportes sincronizados por producto y aplica el resultado
-- en una sola transacción de servidor.
-- ============================================================
CREATE OR REPLACE FUNCTION public.lc_aceptar_inventario_colaborativo(
  p_inventario_id TEXT,
  p_autorizado_por_id UUID,
  p_autorizado_por_nombre TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.inventarios%ROWTYPE;
  v_faltan BIGINT;
  v_difs BIGINT := 0;
  v_total BIGINT := 0;
  v_now TIMESTAMPTZ := NOW();
  r RECORD;
  v_total_fisico NUMERIC;
  v_ajuste NUMERIC;
  v_ultimo RECORD;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NO_AUTENTICADO'; END IF;

  SELECT * INTO v_inv FROM public.inventarios WHERE id=p_inventario_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'INVENTARIO_NO_EXISTE'; END IF;
  IF v_inv.estado='ACEPTADO' THEN RETURN jsonb_build_object('ok',true,'ya_aceptado',true,'productos',v_inv.total_productos); END IF;
  IF v_inv.estado<>'EN_CONTEO' THEN RAISE EXCEPTION 'INVENTARIO_NO_EDITABLE: estado %',v_inv.estado; END IF;

  -- Cambiar estado dentro de esta misma transacción hace que el trigger bloquee
  -- nuevos aportes que intenten llegar mientras se está cerrando.
  UPDATE public.inventarios SET estado='PENDIENTE_AUTORIZACION', actualizado=v_now WHERE id=p_inventario_id;

  SELECT COUNT(*) INTO v_faltan
  FROM public.inventario_detalle d
  WHERE d.inventario_id=p_inventario_id
    AND NOT EXISTS (
      SELECT 1 FROM public.inventario_aportes a
      WHERE a.inventario_id=d.inventario_id AND a.producto_id=d.producto_id AND a.eliminado_en IS NULL
    );
  IF v_faltan>0 THEN
    RAISE EXCEPTION 'FALTAN_CONTEOS: % producto(s) sin aporte; para confirmar cero agregue un aporte 0',v_faltan;
  END IF;

  FOR r IN
    SELECT d.* FROM public.inventario_detalle d
    WHERE d.inventario_id=p_inventario_id
    ORDER BY d.producto_id
  LOOP
    SELECT COALESCE(SUM(a.cantidad),0) INTO v_total_fisico
    FROM public.inventario_aportes a
    WHERE a.inventario_id=p_inventario_id AND a.producto_id=r.producto_id AND a.eliminado_en IS NULL;

    SELECT a.contado_por_id,a.contado_por_nombre,a.device_id,a.contado_en
      INTO v_ultimo
    FROM public.inventario_aportes a
    WHERE a.inventario_id=p_inventario_id AND a.producto_id=r.producto_id AND a.eliminado_en IS NULL
    ORDER BY a.contado_en DESC,a.id DESC LIMIT 1;

    v_ajuste := v_total_fisico - COALESCE(r.esperado,0);
    IF v_ajuste<>0 THEN v_difs:=v_difs+1; END IF;
    v_total:=v_total+1;

    -- Bloqueo de cada producto evita cruces con ventas atómicas.
    PERFORM 1 FROM public.productos WHERE id=r.producto_id FOR UPDATE;

    UPDATE public.productos
    SET cantidad=v_total_fisico,
        cantidad_maleta=LEAST(COALESCE(cantidad_maleta,0),v_total_fisico),
        actualizado=v_now
    WHERE id=r.producto_id;

    UPDATE public.inventario_detalle
    SET conteo_fisico=v_total_fisico,
        diferencia=v_ajuste,
        contado_por_id=v_ultimo.contado_por_id,
        contado_por_nombre=v_ultimo.contado_por_nombre,
        contado_device_id=v_ultimo.device_id,
        contado_en=v_ultimo.contado_en,
        actualizado=v_now
    WHERE id=r.id;

    IF v_ajuste<>0 THEN
      INSERT INTO public.inventario_movimientos(
        id,producto_id,pedido_id,tipo,cantidad,motivo,fecha,device_id,usuario_id,
        actualizado,referencia_id,autorizado_por_id,autorizado_por_nombre,origen
      ) VALUES (
        'm'||REPLACE(gen_random_uuid()::TEXT,'-',''),r.producto_id,NULL,'AJUSTE_INVENTARIO',v_ajuste,
        'Cuadre '||v_inv.numero||': físico '||v_total_fisico||', esperado '||COALESCE(r.esperado,0),
        v_now,'SERVIDOR',auth.uid(),v_now,p_inventario_id,p_autorizado_por_id,p_autorizado_por_nombre,'LCEXPRESS'
      );
    END IF;
  END LOOP;

  UPDATE public.inventarios
  SET estado='ACEPTADO',fecha_cierre=v_now,autorizado_por_id=p_autorizado_por_id,
      autorizado_por_nombre=p_autorizado_por_nombre,autorizado_en=v_now,
      total_productos=v_total,total_diferencias=v_difs,actualizado=v_now
  WHERE id=p_inventario_id;

  UPDATE public.inventario_participantes SET activo=false,actualizado=v_now WHERE inventario_id=p_inventario_id;
  RETURN jsonb_build_object('ok',true,'productos',v_total,'diferencias',v_difs);
END;
$$;
GRANT EXECUTE ON FUNCTION public.lc_aceptar_inventario_colaborativo(TEXT,UUID,TEXT) TO authenticated;

-- ============================================================
-- 4) PEDIDO + STOCK ATÓMICOS
-- Dos dispositivos pueden vender al mismo tiempo en la misma ruta.
-- PostgreSQL bloquea las filas de producto y nunca permite consumir dos veces
-- las últimas unidades.
-- ============================================================
CREATE OR REPLACE FUNCTION public.lc_guardar_pedido_atomico(
  p_pedido JSONB,
  p_items JSONB,
  p_usuario_id UUID,
  p_device_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id TEXT := p_pedido->>'id';
  v_now TIMESTAMPTZ := NOW();
  v_pid TEXT;
  v_old NUMERIC;
  v_new NUMERIC;
  v_delta NUMERIC;
  v_stock NUMERIC;
  v_maleta NUMERIC;
  v_desc TEXT;
  v_item JSONB;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NO_AUTENTICADO'; END IF;
  IF v_id IS NULL OR v_id='' THEN RAISE EXCEPTION 'PEDIDO_ID_INVALIDO'; END IF;
  IF jsonb_typeof(p_items)<>'array' OR jsonb_array_length(p_items)=0 THEN RAISE EXCEPTION 'PEDIDO_SIN_ITEMS'; END IF;

  IF EXISTS(SELECT 1 FROM public.pedidos WHERE id=v_id AND estado='ANULADO') THEN
    RAISE EXCEPTION 'PEDIDO_ANULADO_NO_EDITABLE';
  END IF;

  -- Bloquear todos los productos afectados, siempre en el mismo orden para evitar deadlocks.
  FOR v_pid IN
    SELECT DISTINCT pid FROM (
      SELECT d.producto_id AS pid FROM public.pedido_detalle d WHERE d.pedido_id=v_id
      UNION
      SELECT x->>'producto_id' AS pid FROM jsonb_array_elements(p_items) x
    ) q WHERE pid IS NOT NULL AND pid<>'' ORDER BY pid
  LOOP
    PERFORM 1 FROM public.productos WHERE id=v_pid FOR UPDATE;
  END LOOP;

  -- Primero validar todos los deltas contra la existencia ya bloqueada.
  FOR v_pid IN
    SELECT DISTINCT pid FROM (
      SELECT d.producto_id AS pid FROM public.pedido_detalle d WHERE d.pedido_id=v_id
      UNION
      SELECT x->>'producto_id' AS pid FROM jsonb_array_elements(p_items) x
    ) q WHERE pid IS NOT NULL AND pid<>'' ORDER BY pid
  LOOP
    SELECT COALESCE(SUM(cantidad),0) INTO v_old FROM public.pedido_detalle WHERE pedido_id=v_id AND producto_id=v_pid AND eliminado_en IS NULL;
    SELECT COALESCE(SUM((x->>'cantidad')::NUMERIC),0) INTO v_new FROM jsonb_array_elements(p_items) x WHERE x->>'producto_id'=v_pid;
    v_delta:=v_new-v_old;
    SELECT COALESCE(cantidad,0),COALESCE(cantidad_maleta,0),COALESCE(descripcion,'') INTO v_stock,v_maleta,v_desc FROM public.productos WHERE id=v_pid;
    IF v_delta>v_stock THEN RAISE EXCEPTION 'STOCK_INSUFICIENTE: %; disponible %, solicitado adicional %',v_desc,v_stock,v_delta; END IF;
  END LOOP;

  INSERT INTO public.pedidos(
    id,numero,fecha,cliente_id,cliente_nombre,cliente_comercio,cliente_telefono,cliente_telefono2,cliente_correo,cliente_direccion,
    departamento,municipio,distrito,cliente_ruta,ruta_id,ruta_nombre,comprobante,total,items_total,modificado,modificaciones,
    forma_pago,pago_efectivo,pago_tarjeta,pago_transferencia,efectivo_recibido,cambio,estado,actualizado,eliminado_en
  ) VALUES (
    v_id,p_pedido->>'numero',(p_pedido->>'fecha')::timestamptz,NULLIF(p_pedido->>'cliente_id',''),COALESCE(p_pedido->>'cliente_nombre',''),COALESCE(p_pedido->>'cliente_comercio',''),COALESCE(p_pedido->>'cliente_telefono',''),COALESCE(p_pedido->>'cliente_telefono2',''),COALESCE(p_pedido->>'cliente_correo',''),COALESCE(p_pedido->>'cliente_direccion',''),
    COALESCE(p_pedido->>'departamento',''),COALESCE(p_pedido->>'municipio',''),COALESCE(p_pedido->>'distrito',''),COALESCE(p_pedido->>'cliente_ruta',''),NULLIF(p_pedido->>'ruta_id',''),COALESCE(p_pedido->>'ruta_nombre',''),COALESCE(p_pedido->>'comprobante','RECIBO'),COALESCE((p_pedido->>'total')::numeric,0),COALESCE((p_pedido->>'items_total')::numeric,0),COALESCE((p_pedido->>'modificado')::boolean,false),COALESCE(p_pedido->'modificaciones','[]'::jsonb),
    COALESCE(p_pedido->>'forma_pago','EFECTIVO'),COALESCE((p_pedido->>'pago_efectivo')::numeric,0),COALESCE((p_pedido->>'pago_tarjeta')::numeric,0),COALESCE((p_pedido->>'pago_transferencia')::numeric,0),COALESCE((p_pedido->>'efectivo_recibido')::numeric,0),COALESCE((p_pedido->>'cambio')::numeric,0),'ACTIVO',v_now,NULL
  )
  ON CONFLICT(id) DO UPDATE SET
    numero=EXCLUDED.numero,fecha=EXCLUDED.fecha,cliente_id=EXCLUDED.cliente_id,cliente_nombre=EXCLUDED.cliente_nombre,
    cliente_comercio=EXCLUDED.cliente_comercio,cliente_telefono=EXCLUDED.cliente_telefono,cliente_telefono2=EXCLUDED.cliente_telefono2,
    cliente_correo=EXCLUDED.cliente_correo,cliente_direccion=EXCLUDED.cliente_direccion,departamento=EXCLUDED.departamento,
    municipio=EXCLUDED.municipio,distrito=EXCLUDED.distrito,cliente_ruta=EXCLUDED.cliente_ruta,ruta_id=EXCLUDED.ruta_id,
    ruta_nombre=EXCLUDED.ruta_nombre,comprobante=EXCLUDED.comprobante,total=EXCLUDED.total,items_total=EXCLUDED.items_total,
    modificado=EXCLUDED.modificado,modificaciones=EXCLUDED.modificaciones,forma_pago=EXCLUDED.forma_pago,
    pago_efectivo=EXCLUDED.pago_efectivo,pago_tarjeta=EXCLUDED.pago_tarjeta,pago_transferencia=EXCLUDED.pago_transferencia,
    efectivo_recibido=EXCLUDED.efectivo_recibido,cambio=EXCLUDED.cambio,actualizado=v_now;

  -- Aplicar deltas y registrar movimientos.
  FOR v_pid IN
    SELECT DISTINCT pid FROM (
      SELECT d.producto_id AS pid FROM public.pedido_detalle d WHERE d.pedido_id=v_id
      UNION
      SELECT x->>'producto_id' AS pid FROM jsonb_array_elements(p_items) x
    ) q WHERE pid IS NOT NULL AND pid<>'' ORDER BY pid
  LOOP
    SELECT COALESCE(SUM(cantidad),0) INTO v_old FROM public.pedido_detalle WHERE pedido_id=v_id AND producto_id=v_pid AND eliminado_en IS NULL;
    SELECT COALESCE(SUM((x->>'cantidad')::NUMERIC),0) INTO v_new FROM jsonb_array_elements(p_items) x WHERE x->>'producto_id'=v_pid;
    v_delta:=v_new-v_old;
    IF v_delta<>0 THEN
      UPDATE public.productos
      SET cantidad=GREATEST(0,COALESCE(cantidad,0)-v_delta),
          cantidad_maleta=LEAST(GREATEST(0,COALESCE(cantidad,0)-v_delta),GREATEST(0,COALESCE(cantidad_maleta,0)-v_delta)),
          actualizado=v_now
      WHERE id=v_pid;
      INSERT INTO public.inventario_movimientos(id,producto_id,pedido_id,tipo,cantidad,motivo,fecha,device_id,usuario_id,actualizado,referencia_id,origen)
      VALUES('m'||REPLACE(gen_random_uuid()::TEXT,'-',''),v_pid,v_id,CASE WHEN v_delta>0 THEN 'VENTA' ELSE 'REVERSO_VENTA' END,-v_delta,CASE WHEN v_delta>0 THEN 'Salida por pedido' ELSE 'Reverso por modificación de pedido' END,v_now,p_device_id,p_usuario_id,v_now,v_id,'LCEXPRESS');
    END IF;
  END LOOP;

  DELETE FROM public.pedido_detalle WHERE pedido_id=v_id;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.pedido_detalle(id,pedido_id,producto_id,codigo,descripcion,cantidad,precio,precio_decimales,subtotal,vendedor_id,vendedor_nombre,actualizado,eliminado_en)
    VALUES(
      v_item->>'detalle_id',v_id,NULLIF(v_item->>'producto_id',''),COALESCE(v_item->>'codigo',''),COALESCE(v_item->>'descripcion',''),
      COALESCE((v_item->>'cantidad')::numeric,0),COALESCE((v_item->>'precio')::numeric,0),COALESCE((v_item->>'precio_decimales')::integer,2),COALESCE((v_item->>'subtotal')::numeric,0),
      NULLIF(v_item->>'vendedor_id','')::uuid,COALESCE(v_item->>'vendedor_nombre',''),v_now,NULL
    );
  END LOOP;

  RETURN jsonb_build_object('ok',true,'pedido_id',v_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.lc_guardar_pedido_atomico(JSONB,JSONB,UUID,TEXT) TO authenticated;

-- ============================================================
-- 5) ANULACIÓN ATÓMICA DE PEDIDO
-- Reintegra existencias con bloqueo de producto y evita dobles reintegros.
-- ============================================================
CREATE OR REPLACE FUNCTION public.lc_anular_pedido_atomico(
  p_pedido_id TEXT,
  p_motivo TEXT,
  p_solicitado_por_id UUID,
  p_solicitado_por_nombre TEXT,
  p_autorizado_por_id UUID,
  p_autorizado_por_nombre TEXT,
  p_device_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  v_estado TEXT;
  v_now TIMESTAMPTZ:=NOW();
  r RECORD;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NO_AUTENTICADO'; END IF;
  SELECT estado INTO v_estado FROM public.pedidos WHERE id=p_pedido_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PEDIDO_NO_EXISTE'; END IF;
  IF v_estado='ANULADO' THEN RETURN jsonb_build_object('ok',true,'ya_anulado',true); END IF;

  FOR r IN
    SELECT producto_id,SUM(cantidad) cantidad FROM public.pedido_detalle
    WHERE pedido_id=p_pedido_id AND eliminado_en IS NULL
    GROUP BY producto_id ORDER BY producto_id
  LOOP
    PERFORM 1 FROM public.productos WHERE id=r.producto_id FOR UPDATE;
    UPDATE public.productos
      SET cantidad=COALESCE(cantidad,0)+r.cantidad,
          cantidad_maleta=LEAST(COALESCE(cantidad,0)+r.cantidad,COALESCE(cantidad_maleta,0)+r.cantidad),
          actualizado=v_now
      WHERE id=r.producto_id;
    INSERT INTO public.inventario_movimientos(id,producto_id,pedido_id,tipo,cantidad,motivo,fecha,device_id,usuario_id,actualizado,referencia_id,autorizado_por_id,autorizado_por_nombre,origen)
    VALUES('m'||REPLACE(gen_random_uuid()::TEXT,'-',''),r.producto_id,p_pedido_id,'ANULACION_PEDIDO',r.cantidad,'Reintegro por anulación: '||p_motivo,v_now,p_device_id,p_solicitado_por_id,v_now,p_pedido_id,p_autorizado_por_id,p_autorizado_por_nombre,'LCEXPRESS');
  END LOOP;

  UPDATE public.pedidos SET estado='ANULADO',motivo_anulacion=p_motivo,anulado_en=v_now,
    anulado_por_id=p_solicitado_por_id,anulado_por_nombre=p_solicitado_por_nombre,
    anulado_autorizado_por_id=p_autorizado_por_id,anulado_autorizado_por_nombre=p_autorizado_por_nombre,
    actualizado=v_now WHERE id=p_pedido_id;
  RETURN jsonb_build_object('ok',true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.lc_anular_pedido_atomico(TEXT,TEXT,UUID,TEXT,UUID,TEXT,TEXT) TO authenticated;

-- ============================================================
-- 6) NO CREAR NUEVOS CÓDIGOS DE PRODUCTO DUPLICADOS
-- No toca los duplicados históricos existentes; solo impide crear/cambiar
-- un código hacia otro ya usado.
-- ============================================================
CREATE OR REPLACE FUNCTION public.lc_codigo_producto_normalizado(v TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT UPPER(REGEXP_REPLACE(TRIM(COALESCE(v,'')), '[[:space:]_.-]+', '', 'g'))
$$;

CREATE OR REPLACE FUNCTION public.lc_evitar_codigo_producto_duplicado()
RETURNS trigger
LANGUAGE plpgsql
SET search_path=public
AS $$
DECLARE v_norm TEXT;
BEGIN
  v_norm:=public.lc_codigo_producto_normalizado(NEW.codigo);
  IF v_norm='' THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' AND public.lc_codigo_producto_normalizado(OLD.codigo)=v_norm THEN RETURN NEW; END IF;
  IF EXISTS(
    SELECT 1 FROM public.productos p
    WHERE p.id<>NEW.id AND p.eliminado_en IS NULL
      AND public.lc_codigo_producto_normalizado(p.codigo)=v_norm
  ) THEN
    RAISE EXCEPTION 'CODIGO_DUPLICADO: % ya está asignado a otro producto',NEW.codigo;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lc_codigo_producto_unico ON public.productos;
CREATE TRIGGER trg_lc_codigo_producto_unico
BEFORE INSERT OR UPDATE OF codigo ON public.productos
FOR EACH ROW EXECUTE FUNCTION public.lc_evitar_codigo_producto_duplicado();

COMMIT;

-- ============================================================
-- DIAGNÓSTICO SOLO LECTURA: códigos repetidos actuales.
-- No modifica ningún producto.
-- ============================================================
SELECT
  public.lc_codigo_producto_normalizado(codigo) AS codigo_normalizado,
  COUNT(*) AS cantidad_registros,
  STRING_AGG(id || ' | ' || COALESCE(descripcion,''), E'\n' ORDER BY descripcion) AS productos
FROM public.productos
WHERE eliminado_en IS NULL AND public.lc_codigo_producto_normalizado(codigo)<>''
GROUP BY public.lc_codigo_producto_normalizado(codigo)
HAVING COUNT(*)>1
ORDER BY cantidad_registros DESC,codigo_normalizado;

-- Diagnóstico específico solicitado:
SELECT id,codigo,descripcion,cantidad,caja,maleta,actualizado
FROM public.productos
WHERE eliminado_en IS NULL
  AND public.lc_codigo_producto_normalizado(codigo)=public.lc_codigo_producto_normalizado('7453038478861')
ORDER BY descripcion;
