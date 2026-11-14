// Recuperación de respuestas oficiales: no reenvía solicitudes de escritura.
export async function recuperarConfirmacion112(q,tipo,id){
 const tabla=tipo==='RUTA'?'lc_ruta_cola112':tipo==='PEDIDO'?'lc_cola_local':null;
 if(!tabla)throw Error('Tipo inválido');
 if(q.running)throw Error('Espere a que termine la sincronización');
 const leer=async tx=>(await tx.getAll(`SELECT * FROM ${tabla} WHERE id=? AND actor=?`,[id,q.actor]))[0];
 const r=await leer(q.db);
 if(!r||!['PENDIENTE','CONFLICTO','ENVIANDO'].includes(r.estado))throw Error('Operación no recuperable');
 const {local_base,...solicitud}=JSON.parse(r.solicitud);
 const {data,error}=await q.rpc('lc_confirmacion112',{p_tipo:tipo,p_solicitud:solicitud});
 if(error)throw Error(error.message);
 if(data?.estado!=='CONFIRMACION_EXACTA')return {estado:data?.estado||'RESPUESTA_INVALIDA'};
 const v=data.respuesta;
 if(v?.ok!==true||(tipo==='RUTA'?(v.op!==id||v.ruta!==r.ruta):(v.operacion_id!==id||v.pedido_id!==r.pedido_id)))throw Error('Confirmación oficial inválida');
 await q.db.writeTransaction(async tx=>{
  const actual=await leer(tx);
  if(q.running||!actual||actual.solicitud!==r.solicitud||actual.estado!==r.estado||actual.respuesta!==r.respuesta||actual.error!==r.error)throw Error('La operación cambió; consulte nuevamente');
  await tx.execute(`UPDATE ${tabla} SET estado=?,respuesta=?,error=? WHERE id=? AND actor=?`,['CONFIRMADO',JSON.stringify(v),null,id,q.actor]);
 });
 return {estado:'CONFIRMACION_EXACTA'};
}
