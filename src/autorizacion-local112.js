// Persistir antes de enviar; nunca reemplazar una solicitud pendiente.
export class AutorizacionLocal112 {
 constructor(db,actor,rpc){if(!db||!actor)throw Error('Sesión y SQLite requeridos');Object.assign(this,{db,actor,rpc});}
 async listar(){return this.db.getAll('SELECT * FROM lc_autorizacion_local112 WHERE actor=? ORDER BY creado',[this.actor]);}
 async guardar(request){const raw=JSON.stringify(request),ruta=request.p_evidencia.ruta;return this.db.writeTransaction(async tx=>{
 const rows=await tx.getAll('SELECT * FROM lc_autorizacion_local112 WHERE actor=? AND ruta=? AND estado=?',[this.actor,ruta,'PENDIENTE']);
 if(rows.length){if(rows.length===1&&rows[0].solicitud===raw)return request.p_id;throw Error('Existe una autorización pendiente para esta ruta. Recupérela primero.');}
 await tx.execute('INSERT INTO lc_autorizacion_local112(id,actor,ruta,creado,solicitud,estado) VALUES(?,?,?,?,?,?)',[request.p_id,this.actor,ruta,new Date().toISOString(),raw,'PENDIENTE']);return request.p_id;
 });}
 async enviar(id){const row=await this.db.getOptional('SELECT * FROM lc_autorizacion_local112 WHERE id=? AND actor=?',[id,this.actor]);if(!row)throw Error('Solicitud local inexistente');if(row.estado==='CONFIRMADA')return JSON.parse(row.respuesta);
 const request=JSON.parse(row.solicitud);const result=await this.rpc('lc_autorizar_correccion112',request);
 if(result?.id!==id||result.ruta!==row.ruta||!['AUTORIZADA','APLICADA','REVOCADA'].includes(result.estado))throw Error('Respuesta de autorización inválida');
 await this.db.writeTransaction(async tx=>{const current=await tx.getOptional('SELECT * FROM lc_autorizacion_local112 WHERE id=? AND actor=?',[id,this.actor]);if(!current||current.solicitud!==row.solicitud)throw Error('Solicitud local cambió');if(current.estado==='PENDIENTE')await tx.execute('UPDATE lc_autorizacion_local112 SET estado=?,respuesta=? WHERE id=? AND actor=?',['CONFIRMADA',JSON.stringify(result),id,this.actor]);});return result;
 }
}
