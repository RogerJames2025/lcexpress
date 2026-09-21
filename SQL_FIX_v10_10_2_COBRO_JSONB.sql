-- LCexpress v10.10.2
-- CORRECCION COBRO ATOMICO: pedidos.modificaciones es JSONB.
-- Este parche NO borra productos, existencias, pedidos ni inventarios.
-- Puede ejecutarse directamente sobre una instalación v10.10.0/v10.10.1.

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
      NULLIF(v_item->>'vendedor_id',''),COALESCE(v_item->>'vendedor_nombre',''),v_now,NULL
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
