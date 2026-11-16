import { column, Schema, Table, PowerSyncDatabase, UpdateType, WASQLiteVFS } from '@powersync/web';

const POWERSYNC_URL = window.LC_CONFIG?.powersyncUrl;
if(window.LC_CONFIG?.releaseApproved!==true||!POWERSYNC_URL)throw Error('Configuración PowerSync no instalada');

const productos = new Table({
  codigo: column.text, descripcion: column.text, categoria: column.text,
  cantidad: column.real, lc_stock_revision: column.integer, precio: column.real, precio_decimales: column.integer, caja: column.text, maleta: column.text,
  cantidad_maleta: column.real, notas: column.text, actualizado: column.text, eliminado_en: column.text
}, { indexes: { codigo: ['codigo'], descripcion: ['descripcion'] } });

const clientes = new Table({
  codigo: column.text, nombre: column.text, apellido: column.text, telefono: column.text,
  dui: column.text, comercio: column.text, direccion: column.text, telefono2: column.text, correo: column.text, observacion: column.text, ubicacion: column.text, comprobante: column.text,
  departamento: column.text, municipio: column.text, distrito: column.text, ruta: column.text, estado_comercial: column.text, fecha_cierre: column.text,
  tipo_comercio: column.text, no_visitar: column.integer, motivo_no_visitar: column.text,
  actualizado: column.text, eliminado_en: column.text
}, { indexes: { nombre: ['nombre'], telefono: ['telefono'], comercio: ['comercio'] } });

const rutas = new Table({
  actor112: column.text,
  codigo: column.text, nombre: column.text, estado: column.text,
  inicio: column.text, fin: column.text, actualizado: column.text, eliminado_en: column.text
});

const pedidos = new Table({
  numero: column.text, fecha: column.text, cliente_id: column.text, cliente_nombre: column.text,
  cliente_comercio: column.text, cliente_telefono: column.text, departamento: column.text,
  municipio: column.text, distrito: column.text, cliente_ruta: column.text, ruta_id: column.text,
  ruta_nombre: column.text, comprobante: column.text, cliente_direccion: column.text, cliente_telefono2: column.text, cliente_correo: column.text, total: column.real, puntos_canjeados: column.integer, items_total: column.real,
  modificado: column.integer, modificaciones: column.text, forma_pago: column.text, pago_efectivo: column.real, pago_tarjeta: column.real, pago_transferencia: column.real, efectivo_recibido: column.real, cambio: column.real,
  estado: column.text, motivo_anulacion: column.text, anulado_en: column.text, anulado_por_id: column.text, anulado_por_nombre: column.text,
  anulado_autorizado_por_id: column.text, anulado_autorizado_por_nombre: column.text,
  actualizado: column.text, eliminado_en: column.text
}, { indexes: { fecha: ['fecha'], cliente: ['cliente_id'], ruta: ['ruta_id'] } });

const pedido_detalle = new Table({
  pedido_id: column.text, producto_id: column.text, codigo: column.text, descripcion: column.text,
  cantidad: column.real, precio: column.real, precio_decimales: column.integer, subtotal: column.real, vendedor_id: column.text, vendedor_nombre: column.text, actualizado: column.text, eliminado_en: column.text
}, { indexes: { pedido: ['pedido_id'], producto: ['producto_id'] } });

const inventario_movimientos = new Table({
  producto_id: column.text, pedido_id: column.text, tipo: column.text, cantidad: column.real,
  motivo: column.text, fecha: column.text, device_id: column.text, usuario_id: column.text, actualizado: column.text,
  referencia_id: column.text, autorizado_por_id: column.text, autorizado_por_nombre: column.text, origen: column.text
});

const configuracion = new Table({
  pedido_prefijo: column.text, pedido_numero: column.integer, cliente_numero: column.integer,
  ruta_numero: column.integer, inventario_numero: column.integer, actualizado: column.text
});


const categorias_producto = new Table({
  nombre: column.text, activo: column.integer, orden: column.integer,
  actualizado: column.text, eliminado_en: column.text
}, { indexes: { nombre: ['nombre'] } });
const cajas = new Table({
  nombre: column.text, activo: column.integer, orden: column.integer,
  actualizado: column.text, eliminado_en: column.text
}, { indexes: { nombre: ['nombre'] } });
const maletas = new Table({
  nombre: column.text, activo: column.integer, orden: column.integer,
  actualizado: column.text, eliminado_en: column.text
}, { indexes: { nombre: ['nombre'] } });

const inventarios = new Table({
  numero: column.text, fecha_inicio: column.text, fecha_cierre: column.text, estado: column.text,
  creado_por_id: column.text, creado_por_nombre: column.text, autorizado_por_id: column.text,
  autorizado_por_nombre: column.text, autorizado_en: column.text, observacion: column.text,
  total_productos: column.real, total_diferencias: column.real, actualizado: column.text
}, { indexes: { estado: ['estado'], fecha: ['fecha_inicio'] } });

const inventario_detalle = new Table({
  inventario_id: column.text, producto_id: column.text, codigo: column.text, descripcion: column.text,
  inventario_inicial: column.real, entradas: column.real, vendido: column.real, otras_salidas: column.real,
  esperado: column.real, conteo_fisico: column.real, diferencia: column.real,
  contado_por_id: column.text, contado_por_nombre: column.text, contado_device_id: column.text, contado_en: column.text, actualizado: column.text
}, { indexes: { inventario: ['inventario_id'], producto: ['producto_id'] } });

const inventario_participantes = new Table({
  inventario_id: column.text, usuario_id: column.text, nombre: column.text, device_id: column.text,
  ultimo_latido: column.text, activo: column.integer, actualizado: column.text
}, { indexes: { inventario: ['inventario_id'], usuario: ['usuario_id'] } });

const inventario_aportes = new Table({
  inventario_id: column.text, producto_id: column.text, cantidad: column.real,
  contado_por_id: column.text, contado_por_nombre: column.text, device_id: column.text,
  contado_en: column.text, actualizado: column.text, eliminado_en: column.text
}, { indexes: { inventario: ['inventario_id'], producto: ['producto_id'], device: ['device_id'] } });

const perfiles = new Table({
  nombre: column.text, apellido: column.text, email: column.text, rol: column.text,
  activo: column.integer, vendedor_codigo: column.text, creado_en: column.text, actualizado: column.text
});

const lc_cola_local = new Table({ actor: column.text, pedido_id: column.text, solicitud: column.text, estado: column.text, respuesta: column.text, error: column.text }, {localOnly:true, indexes:{actor:['actor'],pedido:['pedido_id']}});
const lc_migracion_local = new Table({actor:column.text,pedido_id:column.text,contenido:column.text,estado:column.text,respuesta:column.text},{localOnly:true,indexes:{actor:['actor']}});
const lc_archivo40 = new Table({actor:column.text,fecha:column.text,contenido:column.text,sha:column.text},{localOnly:true});
const lc_inv_cola37 = new Table({actor:column.text,device:column.text,orden:column.integer,creado:column.text,solicitud:column.text,estado:column.text,respuesta:column.text,error:column.text},{localOnly:true,indexes:{actor:["actor","device"]}});
const lc_ruta_catalogo112 = new Table({actor:column.text,datos:column.text,fecha:column.text},{localOnly:true,indexes:{actor:["actor"]}});
const lc_ruta_cola112 = new Table({actor:column.text,ruta:column.text,orden:column.integer,creado:column.text,solicitud:column.text,estado:column.text,respuesta:column.text,error:column.text},{localOnly:true,indexes:{actor:["actor"],ruta:["ruta"]}});
const lc_venta_admin_local112 = new Table({actor:column.text,creado:column.text,solicitud:column.text,estado:column.text,respuesta:column.text},{localOnly:true,indexes:{actor:["actor"]}});
const lc_autorizacion_local112 = new Table({actor:column.text,ruta:column.text,creado:column.text,solicitud:column.text,estado:column.text,respuesta:column.text},{localOnly:true,indexes:{actor:["actor"],ruta:["ruta"]}});
const AppSchema = new Schema({
  lc_autorizacion_local112,
  lc_venta_admin_local112,
  lc_ruta_catalogo112,
  lc_ruta_cola112,
  lc_archivo40,
  lc_inv_cola37,
  lc_migracion_local,
  lc_cola_local,
  productos, clientes, rutas, pedidos, pedido_detalle,
  inventario_movimientos, inventarios, inventario_detalle, inventario_participantes, inventario_aportes, configuracion, perfiles, categorias_producto, cajas, maletas
});

export const db = new PowerSyncDatabase({
  schema: AppSchema,
  database: {
    dbFilename: 'lcexpress-v10.sqlite',
    // OPFSCoopSyncVFS gives the most reliable Safari/iOS multi-tab persistence.
    // PowerSync falls back to supported browser behavior where needed.
    vfs: WASQLiteVFS.OPFSCoopSyncVFS
  }
});

function supabaseClient() {
  const client = window.LC_SUPABASE;
  if (!client) throw new Error('Supabase todavía no está inicializado');
  return client;
}


function normalizeForSupabase(tableName, data = {}) {
  const out = { ...data };
  // SQLite/PowerSync stores booleans as 0/1. PostgreSQL expects JSON booleans.
  if (tableName === 'clientes' && Object.prototype.hasOwnProperty.call(out, 'no_visitar')) {
    out.no_visitar = out.no_visitar === true || Number(out.no_visitar || 0) === 1;
  }
  return out;
}

class LCConnector {
  async fetchCredentials() {
    const sb = supabaseClient();
    let { data, error } = await sb.auth.getSession();
    if (error) throw error;
    let session = data?.session || null;
    // Si existe una sesión persistida, intentamos renovarla antes de declarar que PowerSync
    // está sin credenciales. Esto permite recuperarse automáticamente al volver Internet.
    if (session) {
      try {
        const refreshed = await sb.auth.refreshSession();
        if (!refreshed.error && refreshed.data?.session) session = refreshed.data.session;
      } catch (e) {
        console.warn('LCexpress: no se pudo renovar la sesión Supabase para PowerSync', e);
      }
    }
    if (!session?.access_token) throw new Error('SESIÓN_NUBE_NO_DISPONIBLE: vuelva a iniciar sesión en LCexpress para sincronizar');
    return { endpoint: POWERSYNC_URL, token: session.access_token };
  }

  async uploadData(database) {
    lastUploadAttemptAt = new Date().toISOString();
    // Procesamos una transacción lógica por llamada. PowerSync volverá a invocar
    // uploadData() inmediatamente mientras existan elementos en la cola.
    const tx = await database.getNextCrudTransaction();
    if (!tx) return;
    const sb = supabaseClient();

    // Recuperación de colas antiguas: algunas versiones crearon el movimiento de venta
    // antes del encabezado del pedido. Si el movimiento referencia un pedido que todavía
    // no existe en Supabase, publicamos primero el encabezado local para satisfacer la FK.
    async function ensurePedidoExists(pedidoId) {
      if (!pedidoId) return;
      const { data: remote, error: readErr } = await sb.from('pedidos').select('id').eq('id', pedidoId).maybeSingle();
      if (readErr) throw readErr;
      if (remote?.id) return;
      const rows = await database.getAll('SELECT * FROM pedidos WHERE id = ? LIMIT 1', [pedidoId]);
      const local = rows?.[0];
      if (!local) throw new Error(`El movimiento referencia el pedido ${pedidoId}, pero ese pedido no existe en la base local ni en Supabase.`);
      const { error: upErr } = await sb.from('pedidos').upsert(local);
      if (upErr) throw upErr;
    }

    // Mantener dependencias dentro de la misma transacción en orden seguro.
    const priority = {
      productos: 10, clientes: 20, rutas: 30, inventarios: 35,
      pedidos: 40, pedido_detalle: 50, inventario_detalle: 55,
      inventario_participantes: 56, inventario_aportes: 57, inventario_movimientos: 60, configuracion: 90
    };
    const ops = [...tx.crud].sort((a,b)=>(priority[a.table]??70)-(priority[b.table]??70));

    try {
      if (ops.some(op=>['rutas','pedidos','pedido_detalle','productos','inventario_movimientos','perfiles','inventarios','inventario_detalle','inventario_aportes','inventario_participantes'].includes(op.table))) throw new Error('Escritura protegida; cola conservada para revisión');
      for (const op of ops) {
        const table = sb.from(op.table);
        if (op.op === UpdateType.PUT) {
          if (op.table === 'inventario_movimientos' && op.opData?.pedido_id) {
            await ensurePedidoExists(op.opData.pedido_id);
          }
          if (op.table === 'pedido_detalle' && op.opData?.pedido_id) {
            await ensurePedidoExists(op.opData.pedido_id);
          }
          const { error } = await table.upsert({ id: op.id, ...normalizeForSupabase(op.table, op.opData || {}) });
          if (error) throw error;
        } else if (op.op === UpdateType.PATCH) {
          const { error } = await table.update(normalizeForSupabase(op.table, op.opData || {})).eq('id', op.id);
          if (error) throw error;
        } else if (op.op === UpdateType.DELETE) {
          if (op.table === 'productos') {
            const now = new Date().toISOString();
            const { error } = await table.update({ eliminado_en: now, actualizado: now }).eq('id', op.id);
            if (error) throw error;
          } else {
            const { error } = await table.delete().eq('id', op.id);
            if (error) throw error;
          }
        }
      }
      await tx.complete();
      lastUploadError = null;
      lastUploadSuccessAt = new Date().toISOString();
    } catch (error) {
      lastUploadError = String(error?.message || error || 'Error desconocido');
      console.error('LCexpress: cambios pendientes; PowerSync reintentará al reconectar.', error);
      throw error;
    }
  }
}

let lastUploadError = null;
let lastUploadAttemptAt = null;
let lastUploadSuccessAt = null;

const connector = new LCConnector();
let started = false;
let connectPromise = null;

export async function startPowerSync({ forceReconnect = false } = {}) {
  if (forceReconnect) {
    try { await db.disconnect(); } catch (e) { console.warn('LCexpress: no se pudo desconectar PowerSync antes de reconectar', e); }
    started = false;
    connectPromise = null;
  }
  if (started) return db;
  if (connectPromise) {
    await connectPromise;
    return db;
  }
  connectPromise = (async () => {
    try {
      await db.connect(connector, {
        // Reduce la espera después de una escritura, sin hacer descargas completas.
        crudUploadThrottleMs: 350,
        retryDelayMs: 2000
      });
      started = true;
      return db;
    } catch (e) {
      started = false;
      throw e;
    } finally {
      connectPromise = null;
    }
  })();
  await connectPromise;
  return db;
}

function historialSeguro(v){if(v==null)return [];for(let n=0;n<4&&typeof v==='string';n++){try{v=JSON.parse(v)}catch{return [v]}}return Array.isArray(v)?v:[v]}
function parseJSON(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (value == null || value === '') return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function productoToApp(r) {
  return { ...r, cantidadMaleta: Number(r.cantidad_maleta || 0), precioDecimales:Number(r.precio_decimales||2)===4?4:2 };
}
function productoToDb(r) {
  return {
    codigo: r.codigo || '', descripcion: r.descripcion || '', categoria: r.categoria || 'GENERAL',
    cantidad: Number(r.cantidad || 0), precio: Number(r.precio || 0), precio_decimales:Number(r.precioDecimales??r.precio_decimales??2)===4?4:2, caja: r.caja || '', maleta: r.maleta || '',
    cantidad_maleta: Number(r.cantidadMaleta ?? r.cantidad_maleta ?? 0), notas: r.notas || '',
    actualizado: r.actualizado || new Date().toISOString(), eliminado_en: r.eliminado_en || null
  };
}
function clienteToApp(r) { return { ...r, estadoComercial:r.estado_comercial||'ACTIVO', fechaCierre:r.fecha_cierre||null, tipoComercio:r.tipo_comercio||'', noVisitar:r.no_visitar===true||Number(r.no_visitar||0)===1, motivoNoVisitar:r.motivo_no_visitar||'' }; }
function clienteToDb(r) {
  return {
    codigo:r.codigo||'', nombre:r.nombre||'', apellido:r.apellido||'', telefono:r.telefono||'', telefono2:r.telefono2||'', correo:r.correo||'', dui:r.dui||null,
    comercio:r.comercio||'', direccion:r.direccion||'', observacion:r.observacion||'', ubicacion:r.ubicacion||null, comprobante:r.comprobante||'RECIBO', departamento:r.departamento||'',
    municipio:r.municipio||'', distrito:r.distrito||'', ruta:r.ruta||'', estado_comercial:r.estadoComercial||r.estado_comercial||'ACTIVO', fecha_cierre:r.fechaCierre||r.fecha_cierre||null, tipo_comercio:r.tipoComercio||r.tipo_comercio||'', no_visitar:(r.noVisitar===true||Number(r.no_visitar||0)===1)?1:0, motivo_no_visitar:r.motivoNoVisitar||r.motivo_no_visitar||'', actualizado:r.actualizado||new Date().toISOString(), eliminado_en:r.eliminado_en||null
  };
}
function rutaToApp(r) { return { ...r }; }
function rutaToDb(r) {
  return { codigo:r.codigo||'', nombre:r.nombre||'', estado:r.estado||'ABIERTA', inicio:r.inicio||new Date().toISOString(), fin:r.fin||null, actualizado:r.actualizado||new Date().toISOString(), eliminado_en:r.eliminado_en||null };
}
function settingsToApp(r) {
  if (!r) return null;
  return { id:'config', pedidoPrefijo:r.pedido_prefijo||'PED', pedidoNumero:Number(r.pedido_numero||1), clienteNumero:Number(r.cliente_numero||1), rutaNumero:Number(r.ruta_numero||1), inventarioNumero:Number(r.inventario_numero||1), actualizado:r.actualizado };
}
function settingsToDb(r) {
  return { pedido_prefijo:r.pedidoPrefijo||'PED', pedido_numero:Number(r.pedidoNumero||1), cliente_numero:Number(r.clienteNumero||1), ruta_numero:Number(r.rutaNumero||1), inventario_numero:Number(r.inventarioNumero||1), actualizado:new Date().toISOString() };
}
function pedidoHeaderToApp(r) {
  return { puntosCanjeados:Number(r.puntos_canjeados||0),
    id:r.id, numero:r.numero, fecha:r.fecha, clienteId:r.cliente_id, clienteNombre:r.cliente_nombre||'', clienteComercio:r.cliente_comercio||'',
    clienteTelefono:r.cliente_telefono||'', clienteTelefono2:r.cliente_telefono2||'', clienteCorreo:r.cliente_correo||'', clienteDireccion:r.cliente_direccion||'', departamento:r.departamento||'', municipio:r.municipio||'', distrito:r.distrito||'', clienteRuta:r.cliente_ruta||'',
    rutaId:r.ruta_id, rutaNombre:r.ruta_nombre||'', comprobante:r.comprobante||'RECIBO', total:Number(r.total||0), itemsTotal:Number(r.items_total||0),
    modificado:!!r.modificado, modificaciones:historialSeguro(r.modificaciones), formaPago:r.forma_pago||'EFECTIVO', pagoEfectivo:Number(r.pago_efectivo||0), pagoTarjeta:Number(r.pago_tarjeta||0), pagoTransferencia:Number(r.pago_transferencia||0), efectivoRecibido:Number(r.efectivo_recibido||0), cambio:Number(r.cambio||0),
    estado:r.estado||'ACTIVO', motivoAnulacion:r.motivo_anulacion||'', anuladoEn:r.anulado_en||null, anuladoPorId:r.anulado_por_id||null, anuladoPorNombre:r.anulado_por_nombre||'',
    anuladoAutorizadoPorId:r.anulado_autorizado_por_id||null, anuladoAutorizadoPorNombre:r.anulado_autorizado_por_nombre||'', actualizado:r.actualizado, items:[]
  };
}
function pedidoHeaderToDb(r) {
  return {
    numero:r.numero, fecha:r.fecha||new Date().toISOString(), cliente_id:r.clienteId||null, cliente_nombre:r.clienteNombre||'', cliente_comercio:r.clienteComercio||'',
    cliente_telefono:r.clienteTelefono||'', cliente_telefono2:r.clienteTelefono2||'', cliente_correo:r.clienteCorreo||'', cliente_direccion:r.clienteDireccion||'', departamento:r.departamento||'', municipio:r.municipio||'', distrito:r.distrito||'', cliente_ruta:r.clienteRuta||'',
    ruta_id:r.rutaId||null, ruta_nombre:r.rutaNombre||'', comprobante:r.comprobante||'RECIBO', total:Number(r.total||0), items_total:Number(r.itemsTotal||0),
    modificado:r.modificado?1:0, modificaciones:JSON.stringify(r.modificaciones||[]), forma_pago:r.formaPago||'EFECTIVO', pago_efectivo:Number(r.pagoEfectivo||0), pago_tarjeta:Number(r.pagoTarjeta||0), pago_transferencia:Number(r.pagoTransferencia||0), efectivo_recibido:Number(r.efectivoRecibido||0), cambio:Number(r.cambio||0),
    estado:r.estado||'ACTIVO', motivo_anulacion:r.motivoAnulacion||null, anulado_en:r.anuladoEn||null, anulado_por_id:r.anuladoPorId||null, anulado_por_nombre:r.anuladoPorNombre||null,
    anulado_autorizado_por_id:r.anuladoAutorizadoPorId||null, anulado_autorizado_por_nombre:r.anuladoAutorizadoPorNombre||null,
    actualizado:r.actualizado||new Date().toISOString(), eliminado_en:null
  };
}
function detalleToApp(r) {
  return { detalleId:r.id, productoId:r.producto_id, codigo:r.codigo||'', descripcion:r.descripcion||'', cantidad:Number(r.cantidad||0), precio:Number(r.precio||0), precioDecimales:Number(r.precio_decimales||2)===4?4:2, subtotal:Number(r.subtotal||0), vendedorId:r.vendedor_id||'', vendedorNombre:r.vendedor_nombre||'' };
}

async function exists(table, id, tx = db) {
  const rows = await tx.getAll(`SELECT id FROM ${table} WHERE id = ? LIMIT 1`, [id]);
  return rows.length > 0;
}

async function writeRecord(table, id, data, tx = db) {
  const keys = Object.keys(data);
  if (await exists(table, id, tx)) {
    await tx.execute(`UPDATE ${table} SET ${keys.map(k=>`${k} = ?`).join(', ')} WHERE id = ?`, [...keys.map(k=>data[k]), id]);
  } else {
    await tx.execute(`INSERT INTO ${table} (id, ${keys.join(', ')}) VALUES (?, ${keys.map(()=>'?').join(', ')})`, [id, ...keys.map(k=>data[k])]);
  }
}

async function getPedidos() {
  const headers = await db.getAll('SELECT * FROM pedidos WHERE eliminado_en IS NULL OR eliminado_en = \'\'');
  const detail = await db.getAll('SELECT * FROM pedido_detalle WHERE eliminado_en IS NULL OR eliminado_en = \'\'');
  const map = new Map(headers.map(r=>[r.id,pedidoHeaderToApp(r)]));
  for (const row of detail) {
    const p = map.get(row.pedido_id);
    if (p) p.items.push(detalleToApp(row));
  }
  for (const p of map.values()) {
    p.items.sort((a,b)=>(a.descripcion||'').localeCompare(b.descripcion||'','es'));
    // Conservar totales oficiales; no sustituirlos por una reconstrucción local.
  }
  return [...map.values()];
}

async function putPedido(order) {
  const now = new Date().toISOString();
  await db.writeTransaction(async tx => {
    await writeRecord('pedidos', order.id, pedidoHeaderToDb({ ...order, actualizado: now }), tx);
    const old = await tx.getAll('SELECT id FROM pedido_detalle WHERE pedido_id = ?', [order.id]);
    const keep = new Set();
    for (let i=0;i<(order.items||[]).length;i++) {
      const item = order.items[i];
      const did = item.detalleId || `${order.id}-d-${i+1}-${item.productoId||'x'}`;
      keep.add(did);
      const data = {
        pedido_id:order.id, producto_id:item.productoId||null, codigo:item.codigo||'', descripcion:item.descripcion||'', cantidad:Number(item.cantidad||0),
        precio:Number(item.precio||0), precio_decimales:Number(item.precioDecimales??item.precio_decimales??2)===4?4:2, subtotal:Number(item.subtotal ?? (Number(item.cantidad||0)*Number(item.precio||0))), vendedor_id:item.vendedorId||null, vendedor_nombre:item.vendedorNombre||'', actualizado:now, eliminado_en:null
      };
      await writeRecord('pedido_detalle', did, data, tx);
    }
    for (const row of old) if (!keep.has(row.id)) await tx.execute('DELETE FROM pedido_detalle WHERE id = ?', [row.id]);
  });
}

async function getAll(store) {
  if (store === 'productos') return (await db.getAll('SELECT * FROM productos WHERE eliminado_en IS NULL OR eliminado_en = \'\'' )).map(productoToApp);
  if (store === 'clientes') return (await db.getAll('SELECT * FROM clientes WHERE eliminado_en IS NULL OR eliminado_en = \'\'' )).map(clienteToApp);
  if (store === 'rutas') return (await db.getAll('SELECT * FROM rutas WHERE eliminado_en IS NULL OR eliminado_en = \'\'' )).map(rutaToApp);
  if (store === 'pedidos') return getPedidos();
  if (store === 'settings') {
    const rows = await db.getAll("SELECT * FROM configuracion WHERE id = 'principal' LIMIT 1");
    const s = settingsToApp(rows[0]);
    return s ? [s] : [];
  }
  if (store === 'inventario_movimientos') return await db.getAll('SELECT * FROM inventario_movimientos');
  if (store === 'inventarios') return await db.getAll('SELECT * FROM inventarios ORDER BY fecha_inicio DESC');
  if (store === 'inventario_detalle') return await db.getAll('SELECT * FROM inventario_detalle');
  if (store === 'inventario_participantes') return await db.getAll('SELECT * FROM inventario_participantes');
  if (store === 'inventario_aportes') return await db.getAll("SELECT * FROM inventario_aportes WHERE eliminado_en IS NULL OR eliminado_en = ''");
  if (store === 'perfiles') return await db.getAll('SELECT * FROM perfiles WHERE activo = 1 OR activo = true');
  if (store === 'categorias_producto' || store === 'cajas' || store === 'maletas') return await db.getAll(`SELECT * FROM ${store} WHERE eliminado_en IS NULL OR eliminado_en = '' ORDER BY orden, nombre`);
  return [];
}

async function put(store, obj) {
  if (store === 'productos') {
    const data=productoToDb(obj); const old=(await db.getAll('SELECT * FROM productos WHERE id=?',[obj.id]))[0];
    if((!old && Number(data.cantidad)!==0) || (old && Number(old.cantidad)!==Number(data.cantidad)) || data.eliminado_en) throw Error('El alta debe iniciar en cero; ajustes y bajas requieren procedimiento autorizado');
    const campos=['codigo','descripcion','categoria','precio','precio_decimales','caja','maleta','cantidad_maleta','notas'];
    const payload=Object.fromEntries(campos.filter(k=>Object.hasOwn(data,k)).map(k=>[k,data[k]]));
    const {error}=await supabaseClient().rpc(old?'lc_producto_metadata34':'lc_producto_alta35',{p_id:obj.id,p_datos:payload}); if(error)throw error; return;
  }
  if (store === 'perfiles') {const {error}=await supabaseClient().rpc('lc_perfil35',{p_id:obj.id,p_nombre:obj.nombre,p_apellido:obj.apellido,p_codigo:obj.vendedor_codigo||''});if(error)throw error;return;}
  if (store === 'clientes') return writeRecord('clientes', obj.id, clienteToDb(obj));
  if (store === 'rutas') throw Error('Utilice la operación de ruta autorizada');
  if (store === 'pedidos') return putPedido(obj);
  if (store === 'settings') return writeRecord('configuracion', 'principal', settingsToDb(obj));
  if (store === 'categorias_producto' || store === 'cajas' || store === 'maletas') {
    const data = { nombre: obj.nombre || '', activo: obj.activo === false ? 0 : (obj.activo === 0 ? 0 : 1), orden: Number(obj.orden || 0), actualizado: obj.actualizado || new Date().toISOString(), eliminado_en: obj.eliminado_en || null };
    return writeRecord(store, obj.id, data);
  }
  if (store === 'inventario_movimientos' || store === 'inventarios' || store === 'inventario_detalle' || store === 'inventario_participantes' || store === 'inventario_aportes') {
    throw Error('Inventario protegido: utilice lc_inventario36');
  }
}

async function del(store, id) {
  if(store==='productos'){const {error}=await supabaseClient().rpc('lc_producto_baja35',{p_id:id});if(error)throw error;return;}
  if(['rutas','pedidos','perfiles','inventarios','inventario_detalle','inventario_movimientos','inventario_aportes','inventario_participantes'].includes(store))throw Error('Borrado protegido; utilice el procedimiento autorizado');
  if (store === 'pedidos') {
    await db.writeTransaction(async tx => {
      await tx.execute('DELETE FROM pedido_detalle WHERE pedido_id = ?', [id]);
      await tx.execute('DELETE FROM pedidos WHERE id = ?', [id]);
    });
    return;
  }
  const table = store === 'settings' ? 'configuracion' : store;
  const key = store === 'settings' ? 'principal' : id;
  await db.execute(`DELETE FROM ${table} WHERE id = ?`, [key]);
}

async function replace(store, list) {
  if(['rutas','productos','pedidos','perfiles','inventarios','inventario_detalle','inventario_movimientos','inventario_aportes','inventario_participantes'].includes(store))throw Error('Restauración masiva protegida; no se modificaron registros de este catálogo');
  if (store === 'settings') {
    await put('settings', list[0] || {id:'config',pedidoPrefijo:'PED',pedidoNumero:1,clienteNumero:1,rutaNumero:1});
    return;
  }
  const table = store;
  if (!['productos','clientes','rutas','pedidos','inventario_movimientos','inventarios','inventario_detalle','inventario_participantes','inventario_aportes','categorias_producto','cajas','maletas'].includes(table)) return;
  const existing = await getAll(store);
  const incoming = new Set(list.map(x=>x.id));
  for (const row of existing) if (!incoming.has(row.id)) await del(store,row.id);
  for (const row of list) await put(store,row);
}


async function anularPedidoAtomic({pedidoId,motivo,solicitadoPorId=null,solicitadoPorNombre='',autorizadoPorId=null,autorizadoPorNombre='',deviceId=''}) {
  const now=new Date().toISOString();
  await db.writeTransaction(async tx=>{
    const hs=await tx.getAll('SELECT * FROM pedidos WHERE id = ? LIMIT 1',[pedidoId]);
    const h=hs?.[0]; if(!h)throw new Error('El pedido no existe en la base local.');
    if(String(h.estado||'ACTIVO').toUpperCase()==='ANULADO')return;
    const detail=await tx.getAll("SELECT * FROM pedido_detalle WHERE pedido_id = ? AND (eliminado_en IS NULL OR eliminado_en = '')",[pedidoId]);
    const qty=new Map();
    for(const d of detail)qty.set(d.producto_id,(qty.get(d.producto_id)||0)+Number(d.cantidad||0));
    for(const [productoId,cantidad] of qty.entries()){
      if(!productoId||!cantidad)continue;
      const rows=await tx.getAll('SELECT * FROM productos WHERE id = ? LIMIT 1',[productoId]);
      const prod=rows?.[0]; if(!prod)continue;
      const nueva=Number(prod.cantidad||0)+cantidad;
      let maleta=Number(prod.cantidad_maleta||0);
      if(prod.maleta)maleta=Math.min(nueva,maleta+cantidad);
      await tx.execute('UPDATE productos SET cantidad = ?, cantidad_maleta = ?, actualizado = ? WHERE id = ?',[nueva,maleta,now,productoId]);
      const mid=`anul-${pedidoId}-${productoId}`;
      const mov={producto_id:productoId,pedido_id:pedidoId,tipo:'ANULACION_PEDIDO',cantidad:Number(cantidad),motivo:'Reintegro por anulación: '+motivo,fecha:now,device_id:deviceId||'',usuario_id:solicitadoPorId||null,actualizado:now,referencia_id:pedidoId,autorizado_por_id:autorizadoPorId||null,autorizado_por_nombre:autorizadoPorNombre||'',origen:'LCEXPRESS'};
      await writeRecord('inventario_movimientos',mid,mov,tx);
    }
    await tx.execute(`UPDATE pedidos SET estado='ANULADO', motivo_anulacion=?, anulado_en=?, anulado_por_id=?, anulado_por_nombre=?, anulado_autorizado_por_id=?, anulado_autorizado_por_nombre=?, actualizado=? WHERE id=?`,[motivo,now,solicitadoPorId,solicitadoPorNombre,autorizadoPorId,autorizadoPorNombre,now,pedidoId]);
  });
}

async function pendingCount() {
  try {
    const rows = await db.getAll('SELECT count(*) AS n FROM ps_crud');
    return Number(rows?.[0]?.n || 0);
  } catch { return 0; }
}

async function profile(uid) {
  const rows = await db.getAll('SELECT * FROM perfiles WHERE id = ? LIMIT 1',[uid]);
  return rows[0] || null;
}

async function syncStatus() {
  const pending = await pendingCount();
  const status = db.currentStatus || {};
  return {
    pending,
    connected: !!status.connected,
    hasSynced: !!status.hasSynced,
    lastSyncedAt: status.lastSyncedAt || null,
    online: navigator.onLine,
    lastUploadError,
    lastUploadAttemptAt,
    lastUploadSuccessAt
  };
}

// Sincronización manual incremental. PowerSync no vuelve a descargar toda la base:
// mantiene su checkpoint y solicita únicamente los cambios posteriores. Del mismo modo,
// uploadData() procesa únicamente las operaciones pendientes en ps_crud.
async function syncNow({ timeoutMs = 20000 } = {}) {
  // Forzar una reconexión NO borra SQLite ni vuelve a descargar toda la base.
  // PowerSync conserva su checkpoint y pide solo cambios posteriores; la reconexión
  // también dispara uploadData() para vaciar ps_crud según la documentación oficial.
  await startPowerSync({ forceReconnect: true });
  const startedAt = Date.now();
  let previousPending = await pendingCount();
  while (Date.now() - startedAt < timeoutMs) {
    const st = await syncStatus();
    if (st.pending === 0 && st.connected) return st;
    if (st.pending < previousPending) previousPending = st.pending;
    await new Promise(resolve => setTimeout(resolve, 350));
  }
  return syncStatus();
}

async function syncDiagnostics() {
  const st = await syncStatus();
  let firstPending = null;
  try {
    const rows = await db.getAll('SELECT id, tx_id, data FROM ps_crud ORDER BY id LIMIT 1');
    firstPending = rows?.[0] || null;
  } catch {}
  return {
    ...st,
    started,
    firstPending
  };
}


// Exportación de la primera transacción pendiente: no avanza ni completa la cola.
async function exportarPendiente35(){
 const tx=await db.getNextCrudTransaction();
 const {data,error}=await supabaseClient().auth.getSession();if(error)throw error;
 const actor=data?.session?.user?.id;if(!actor)throw Error('Sesión requerida');
 const out={formato:'LCexpress-powersync-cabecera-35',actor,base:'lcexpress-v10.sqlite',fecha:new Date().toISOString(),operaciones:tx?tx.crud.map(x=>({table:x.table,id:x.id,op:x.op,opData:x.opData??null})):[]};
 const url=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='LCexpress_pendiente_'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return out.operaciones.length;
}
// Exporta la cola interna completa sin completar ninguna transacción.
async function exportarIntegral38(){
 const {data,error}=await supabaseClient().auth.getSession();if(error)throw error;const actor=data?.session?.user?.id;if(!actor)throw Error('Sesión requerida');
 const out=await db.readTransaction(async tx=>({formato:'LCexpress-integral40',actor,base:'lcexpress-v10.sqlite',fecha:new Date().toISOString(),ps_crud:await tx.getAll('SELECT * FROM ps_crud ORDER BY id'),inventario:await tx.getAll('SELECT * FROM lc_inv_cola37 WHERE actor=? ORDER BY device,orden',[actor]),ventasAdmin112:await tx.getAll('SELECT * FROM lc_venta_admin_local112 WHERE actor=?',[actor]),autorizaciones112:await tx.getAll('SELECT * FROM lc_autorizacion_local112 WHERE actor=?',[actor]),rutas112:await tx.getAll('SELECT * FROM lc_ruta_cola112 WHERE actor=? ORDER BY orden',[actor]),pedidos:await tx.getAll('SELECT * FROM lc_cola_local WHERE actor=?',[actor]),migracion:await tx.getAll('SELECT * FROM lc_migracion_local WHERE actor=?',[actor]),archivos:await tx.getAll('SELECT * FROM lc_archivo40 WHERE actor=?',[actor]),pendientes_raw:localStorage.getItem('lcexpress_offline_pending_v2'),pendientes_v40_raw:localStorage.getItem('lcexpress_offline_pending_v40')}));
 const url=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='LCexpress_integral_'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return out;
}
async function reconciliarMixta38(){
 const tx=await db.getNextCrudTransaction();if(!tx)throw Error('Sin transacciones pendientes');const ops=tx.crud.map(o=>({table:o.table,id:o.id,op:o.op,opData:o.opData??null}));
 const {data,error}=await supabaseClient().rpc('lc_reconciliar40',{p_ops:ops});if(error)throw error;if(!data?.ok)throw Error('Conservada: '+JSON.stringify(data));
 if(!await window.LCDialog.confirm('Todos los campos enviados coinciden actualmente con el servidor. Esto no prueba el historial. ¿Completar esta transacción sin repetir escrituras?\n'+JSON.stringify(ops)))return;
 const head=await db.getNextCrudTransaction();if(!head||JSON.stringify(head.crud.map(o=>({table:o.table,id:o.id,op:o.op,opData:o.opData??null})))!==JSON.stringify(ops))throw Error('La cabecera cambió; vuelva a revisar');
 const check=await supabaseClient().rpc('lc_reconciliar40',{p_ops:ops});if(check.error||!check.data?.ok)throw Error('La coincidencia cambió; se conserva la transacción');await head.complete();window.LCDialog.alert('Transacción completada sin repetir escrituras');
}
async function importarArchivo40(file){
 const {data,error}=await supabaseClient().auth.getSession();if(error)throw error;
 const actor=data?.session?.user?.id;if(!actor)throw Error('Sesión requerida');
 if(!file || file.size>100*1024*1024)throw Error('Archivo ausente o superior a 100 MB; conservar original');
 const bytes=await file.arrayBuffer();const raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes);const obj=JSON.parse(raw);
 if(!['LCexpress-produccion38','LCexpress-produccion40','LCexpress-integral38','LCexpress-integral40'].includes(obj.formato)||!Array.isArray(obj.ps_crud))throw Error('Formato no reconocido; conservar original');
 const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
 const id=actor+':'+sha;
 await db.writeTransaction(async tx=>{await tx.execute('INSERT OR IGNORE INTO lc_archivo40(id,actor,fecha,contenido,sha) VALUES(?,?,?,?,?)',[id,actor,new Date().toISOString(),raw,sha]);});
 return {sha,operaciones:obj.ps_crud.length,estado:'ARCHIVADO_NO_REPRODUCIDO'};
}
async function listarArchivos40(){const {data,error}=await supabaseClient().auth.getSession();if(error)throw error;const actor=data?.session?.user?.id;if(!actor)throw Error('Sesión requerida');return db.getAll('SELECT id,fecha,sha FROM lc_archivo40 WHERE actor=? ORDER BY fecha',[actor]);}
window.LCCloud = { importarArchivo40,listarArchivos40,
  snapshotToApp: (d)=>({...pedidoHeaderToApp(d.pedido),items:d.items.map(detalleToApp),revision:d.revision}),
  exportarPendiente35, exportarIntegral38, reconciliarMixta38, db, startPowerSync, getAll, put, del, replace, anularPedidoAtomic, pendingCount, profile, syncStatus, syncNow, syncDiagnostics,
  url: POWERSYNC_URL
};
window.dispatchEvent(new CustomEvent('lcexpress-cloud-ready'));
