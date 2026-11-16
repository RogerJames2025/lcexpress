// Evidencia original: nunca reproduce directamente ps_crud ni inventa datos faltantes.
import {candidatos, firma} from './migracion23.js';
export async function leerEvidencia41(file){
 if(!file||file.size>100*1024*1024)throw Error('Seleccione un archivo de hasta 100 MB');
 const bytes=await file.arrayBuffer(), raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
 let normal=raw;
 if(['LCexpress-produccion38','LCexpress-produccion40','LCexpress-integral38','LCexpress-integral40'].includes(raw.formato)){
  const pendientes=JSON.parse(raw.pendientes_raw||'[]');if(!Array.isArray(pendientes))throw Error('Formato de pendientes no reconocido');
  normal={pendientes,pedidos:[]};
 }
 const cs=candidatos(normal);
 // Solo cabecera normalizada exportada por el SDK; nunca inferir la codificación interna de ps_crud.
 const ops=raw.operaciones;
 if(Array.isArray(ops))for(const h of ops.filter(o=>o.table==='pedidos'&&o.op==='PUT'&&o.opData)){
  const pedido={...h.opData,id:h.id};
  const items=ops.filter(o=>o.table==='pedido_detalle'&&o.op==='PUT'&&o.opData?.pedido_id===h.id).map(o=>({...o.opData,detalle_id:o.id}));
  if(pedido.modificado===0)pedido.modificado=false;
  if(typeof pedido.modificaciones==='string'){try{pedido.modificaciones=JSON.parse(pedido.modificaciones)}catch{continue}}
  if(pedido.estado!=='ACTIVO'||pedido.modificado||!items.length||ops.some(o=>o.op==='DELETE'||(o.table==='pedidos'&&o.id===h.id&&o!==h)))continue;
  try{firma(pedido,items)}catch{continue}
  const existente=cs.find(c=>c.pedido?.id===h.id);
  if(existente){try{if(firma(existente.pedido,existente.items)!==firma(pedido,items))existente.ambiguo=true;}catch{existente.ambiguo=true;}continue;}
  cs.push({pedido,items,evidencia:true,original:{origen:'cabecera-normalizada',operaciones:ops}});
 }
 return {sha,cs,raw};
}
export async function importarEvidencia41(m,file){
 const {sha,cs,raw}=await leerEvidencia41(file);
 if(raw.actor&&raw.actor!==m.actor&&!await window.LCDialog.confirm('El archivo pertenece a otra sesión. Verifique su procedencia; la recuperación se auditará con su cuenta administrativa.'))return 0;
 if(Array.isArray(raw.ps_crud)&&window.LCCloud?.importarArchivo40)await window.LCCloud.importarArchivo40(file);
 const prepared=[];
 for(const c of cs){c.sha=sha;const payload=JSON.stringify(c);const id=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(m.actor+'\n'+payload))),x=>x.toString(16).padStart(2,'0')).join('');prepared.push({c,payload,id});}
 await m.db.writeTransaction(async tx=>{for(const {c,payload,id} of prepared)await tx.execute('INSERT OR IGNORE INTO lc_migracion_local (id,actor,pedido_id,contenido,estado) VALUES (?,?,?,?,?)',[id,m.actor,c.pedido?.id||'',payload,'SIN_VERIFICAR']);});return prepared.length;
}
export async function recuperarPedido41(m,r){
 const c=JSON.parse(r.contenido);if(!c.evidencia||c.ambiguo||!c.sha||!c.pedido||c.pedido.modificado||c.pedido.estado!=='ACTIVO')throw Error('Evidencia insuficiente; conserve el archivo original');
 firma(c.pedido,c.items);
 const key='lc_recuperacion41:'+m.actor+':'+r.id;
 let req=JSON.parse(localStorage.getItem(key)||'null');
 if(!req){
  const {data,error}=await m.rpc('lc_auditar_recuperacion24',{p:c.pedido,items:c.items});if(error)throw Error(error.message);if(data?.estado!=='RECUPERABLE')throw Error('Auditoría requiere revisión manual: '+JSON.stringify(data));
  const motivo=await window.LCDialog.prompt('Revise evidencia, dinero recibido y movimientos. Confirme que las cantidades faltantes no se descontaron por otra referencia.\n'+JSON.stringify(data.diferencias)+'\nMotivo (mínimo 10 caracteres):');if(!motivo||motivo.trim().length<10)return;
  if(!await window.LCDialog.confirm('Recuperar el pedido histórico '+c.pedido.numero+' sin puntos nuevos. SHA-256: '+c.sha+'\nNo se puede deshacer automáticamente. ¿Autoriza?'))return;
  req={p_op:crypto.randomUUID(),p_pedido:c.pedido,p_items:c.items,p_auditoria:data,p_sha:c.sha,p_motivo:motivo,p_device:'recuperacion-administrativa'};
  localStorage.setItem(key,JSON.stringify(req));
 }
 const {data,error}=await m.rpc('lc_recuperar_pedido41',req);if(error)throw Error(error.message);if(!data?.ok||data.pedido_id!==c.pedido.id||data.operacion_id!==req.p_op)throw Error('Confirmación no verificable; solicitud conservada');
 await m.db.execute('UPDATE lc_migracion_local SET estado=?,respuesta=? WHERE id=? AND actor=?',['RECUPERADO',JSON.stringify(data),r.id,m.actor]);localStorage.removeItem(key);return data;
}
