import { column, Schema, Table, PowerSyncDatabase, UpdateType, WASQLiteVFS } from '@powersync/web';

const POWERSYNC_URL = 'https://6a761b9d53f73afec8a7b5f0.powersync.journeyapps.com';

const productos = new Table({
  codigo: column.text, descripcion: column.text, categoria: column.text,
  cantidad: column.real, precio: column.real, caja: column.text, maleta: column.text,
  cantidad_maleta: column.real, notas: column.text, actualizado: column.text, eliminado_en: column.text
}, { indexes: { codigo: ['codigo'], descripcion: ['descripcion'] } });

const clientes = new Table({
  codigo: column.text, nombre: column.text, apellido: column.text, telefono: column.text,
  dui: column.text, comercio: column.text, direccion: column.text, telefono2: column.text, correo: column.text, observacion: column.text, ubicacion: column.text, comprobante: column.text,
  departamento: column.text, municipio: column.text, distrito: column.text, ruta: column.text,
  actualizado: column.text, eliminado_en: column.text
}, { indexes: { nombre: ['nombre'], telefono: ['telefono'], comercio: ['comercio'] } });

const rutas = new Table({
  codigo: column.text, nombre: column.text, estado: column.text,
  inicio: column.text, fin: column.text, actualizado: column.text, eliminado_en: column.text
});

const pedidos = new Table({
  numero: column.text, fecha: column.text, cliente_id: column.text, cliente_nombre: column.text,
  cliente_comercio: column.text, cliente_telefono: column.text, departamento: column.text,
  municipio: column.text, distrito: column.text, cliente_ruta: column.text, ruta_id: column.text,
  ruta_nombre: column.text, comprobante: column.text, cliente_direccion: column.text, cliente_telefono2: column.text, cliente_correo: column.text, total: column.real, items_total: column.real,
  modificado: column.integer, modificaciones: column.text, actualizado: column.text, eliminado_en: column.text
}, { indexes: { fecha: ['fecha'], cliente: ['cliente_id'], ruta: ['ruta_id'] } });

const pedido_detalle = new Table({
  pedido_id: column.text, producto_id: column.text, codigo: column.text, descripcion: column.text,
  cantidad: column.real, precio: column.real, subtotal: column.real, vendedor_id: column.text, vendedor_nombre: column.text, actualizado: column.text, eliminado_en: column.text
}, { indexes: { pedido: ['pedido_id'], producto: ['producto_id'] } });

const inventario_movimientos = new Table({
  producto_id: column.text, pedido_id: column.text, tipo: column.text, cantidad: column.real,
  motivo: column.text, fecha: column.text, device_id: column.text, usuario_id: column.text, actualizado: column.text
});

const configuracion = new Table({
  pedido_prefijo: column.text, pedido_numero: column.integer, cliente_numero: column.integer,
  ruta_numero: column.integer, actualizado: column.text
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

const perfiles = new Table({
  nombre: column.text, apellido: column.text, email: column.text, rol: column.text,
  activo: column.integer, vendedor_codigo: column.text, creado_en: column.text, actualizado: column.text
});

const AppSchema = new Schema({
  productos, clientes, rutas, pedidos, pedido_detalle,
  inventario_movimientos, configuracion, perfiles, categorias_producto, cajas, maletas
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

class LCConnector {
  async fetchCredentials() {
    const sb = supabaseClient();
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    if (!data?.session?.access_token) throw new Error('No hay una sesión autenticada para PowerSync');
    return { endpoint: POWERSYNC_URL, token: data.session.access_token };
  }

  async uploadData(database) {
    lastUploadAttemptAt = new Date().toISOString();
    const batch = await database.getCrudBatch();
    if (!batch) return;
    const sb = supabaseClient();
    try {
      for (const op of batch.crud) {
        const table = sb.from(op.table);
        if (op.op === UpdateType.PUT) {
          const { error } = await table.upsert({ id: op.id, ...(op.opData || {}) });
          if (error) throw error;
        } else if (op.op === UpdateType.PATCH) {
          const { error } = await table.update(op.opData || {}).eq('id', op.id);
          if (error) throw error;
        } else if (op.op === UpdateType.DELETE) {
          const { error } = await table.delete().eq('id', op.id);
          if (error) throw error;
        }
      }
      await batch.complete();
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

function parseJSON(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (value == null || value === '') return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function productoToApp(r) {
  return { ...r, cantidadMaleta: Number(r.cantidad_maleta || 0) };
}
function productoToDb(r) {
  return {
    codigo: r.codigo || '', descripcion: r.descripcion || '', categoria: r.categoria || 'GENERAL',
    cantidad: Number(r.cantidad || 0), precio: Number(r.precio || 0), caja: r.caja || '', maleta: r.maleta || '',
    cantidad_maleta: Number(r.cantidadMaleta ?? r.cantidad_maleta ?? 0), notas: r.notas || '',
    actualizado: r.actualizado || new Date().toISOString(), eliminado_en: r.eliminado_en || null
  };
}
function clienteToApp(r) { return { ...r }; }
function clienteToDb(r) {
  return {
    codigo:r.codigo||'', nombre:r.nombre||'', apellido:r.apellido||'', telefono:r.telefono||'', telefono2:r.telefono2||'', correo:r.correo||'', dui:r.dui||null,
    comercio:r.comercio||'', direccion:r.direccion||'', observacion:r.observacion||'', ubicacion:r.ubicacion||null, comprobante:r.comprobante||'RECIBO', departamento:r.departamento||'',
    municipio:r.municipio||'', distrito:r.distrito||'', ruta:r.ruta||'', actualizado:r.actualizado||new Date().toISOString(), eliminado_en:r.eliminado_en||null
  };
}
function rutaToApp(r) { return { ...r }; }
function rutaToDb(r) {
  return { codigo:r.codigo||'', nombre:r.nombre||'', estado:r.estado||'ABIERTA', inicio:r.inicio||new Date().toISOString(), fin:r.fin||null, actualizado:r.actualizado||new Date().toISOString(), eliminado_en:r.eliminado_en||null };
}
function settingsToApp(r) {
  if (!r) return null;
  return { id:'config', pedidoPrefijo:r.pedido_prefijo||'PED', pedidoNumero:Number(r.pedido_numero||1), clienteNumero:Number(r.cliente_numero||1), rutaNumero:Number(r.ruta_numero||1), actualizado:r.actualizado };
}
function settingsToDb(r) {
  return { pedido_prefijo:r.pedidoPrefijo||'PED', pedido_numero:Number(r.pedidoNumero||1), cliente_numero:Number(r.clienteNumero||1), ruta_numero:Number(r.rutaNumero||1), actualizado:new Date().toISOString() };
}
function pedidoHeaderToApp(r) {
  return {
    id:r.id, numero:r.numero, fecha:r.fecha, clienteId:r.cliente_id, clienteNombre:r.cliente_nombre||'', clienteComercio:r.cliente_comercio||'',
    clienteTelefono:r.cliente_telefono||'', clienteTelefono2:r.cliente_telefono2||'', clienteCorreo:r.cliente_correo||'', clienteDireccion:r.cliente_direccion||'', departamento:r.departamento||'', municipio:r.municipio||'', distrito:r.distrito||'', clienteRuta:r.cliente_ruta||'',
    rutaId:r.ruta_id, rutaNombre:r.ruta_nombre||'', comprobante:r.comprobante||'RECIBO', total:Number(r.total||0), itemsTotal:Number(r.items_total||0),
    modificado:!!r.modificado, modificaciones:parseJSON(r.modificaciones,[]), actualizado:r.actualizado, items:[]
  };
}
function pedidoHeaderToDb(r) {
  return {
    numero:r.numero, fecha:r.fecha||new Date().toISOString(), cliente_id:r.clienteId||null, cliente_nombre:r.clienteNombre||'', cliente_comercio:r.clienteComercio||'',
    cliente_telefono:r.clienteTelefono||'', cliente_telefono2:r.clienteTelefono2||'', cliente_correo:r.clienteCorreo||'', cliente_direccion:r.clienteDireccion||'', departamento:r.departamento||'', municipio:r.municipio||'', distrito:r.distrito||'', cliente_ruta:r.clienteRuta||'',
    ruta_id:r.rutaId||null, ruta_nombre:r.rutaNombre||'', comprobante:r.comprobante||'RECIBO', total:Number(r.total||0), items_total:Number(r.itemsTotal||0),
    modificado:r.modificado?1:0, modificaciones:JSON.stringify(r.modificaciones||[]), actualizado:r.actualizado||new Date().toISOString(), eliminado_en:null
  };
}
function detalleToApp(r) {
  return { detalleId:r.id, productoId:r.producto_id, codigo:r.codigo||'', descripcion:r.descripcion||'', cantidad:Number(r.cantidad||0), precio:Number(r.precio||0), subtotal:Number(r.subtotal||0), vendedorId:r.vendedor_id||'', vendedorNombre:r.vendedor_nombre||'' };
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
    p.itemsTotal = p.items.reduce((s,i)=>s+Number(i.cantidad||0),0);
    p.total = p.items.reduce((s,i)=>s+Number(i.subtotal||0),0);
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
        precio:Number(item.precio||0), subtotal:Number(item.subtotal ?? (Number(item.cantidad||0)*Number(item.precio||0))), vendedor_id:item.vendedorId||null, vendedor_nombre:item.vendedorNombre||'', actualizado:now, eliminado_en:null
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
  if (store === 'perfiles') return await db.getAll('SELECT * FROM perfiles WHERE activo = 1 OR activo = true');
  if (store === 'categorias_producto' || store === 'cajas' || store === 'maletas') return await db.getAll(`SELECT * FROM ${store} WHERE eliminado_en IS NULL OR eliminado_en = '' ORDER BY orden, nombre`);
  return [];
}

async function put(store, obj) {
  if (store === 'productos') return writeRecord('productos', obj.id, productoToDb(obj));
  if (store === 'clientes') return writeRecord('clientes', obj.id, clienteToDb(obj));
  if (store === 'rutas') return writeRecord('rutas', obj.id, rutaToDb(obj));
  if (store === 'pedidos') return putPedido(obj);
  if (store === 'settings') return writeRecord('configuracion', 'principal', settingsToDb(obj));
  if (store === 'categorias_producto' || store === 'cajas' || store === 'maletas') {
    const data = { nombre: obj.nombre || '', activo: obj.activo === false ? 0 : (obj.activo === 0 ? 0 : 1), orden: Number(obj.orden || 0), actualizado: obj.actualizado || new Date().toISOString(), eliminado_en: obj.eliminado_en || null };
    return writeRecord(store, obj.id, data);
  }
  if (store === 'inventario_movimientos') {
    const data = { ...obj }; delete data.id;
    return writeRecord('inventario_movimientos', obj.id, data);
  }
}

async function del(store, id) {
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
  if (store === 'settings') {
    await put('settings', list[0] || {id:'config',pedidoPrefijo:'PED',pedidoNumero:1,clienteNumero:1,rutaNumero:1});
    return;
  }
  const table = store;
  if (!['productos','clientes','rutas','pedidos','inventario_movimientos','categorias_producto','cajas','maletas'].includes(table)) return;
  const existing = await getAll(store);
  const incoming = new Set(list.map(x=>x.id));
  for (const row of existing) if (!incoming.has(row.id)) await del(store,row.id);
  for (const row of list) await put(store,row);
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


window.LCCloud = {
  db, startPowerSync, getAll, put, del, replace, pendingCount, profile, syncStatus, syncNow, syncDiagnostics,
  url: POWERSYNC_URL
};
window.dispatchEvent(new CustomEvent('lcexpress-cloud-ready'));
