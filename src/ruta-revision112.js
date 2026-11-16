// Evidencia local de una ruta en conflicto. Solo lectura; no autoriza ni ejecuta correcciones.
export async function evidenciaRuta112(db,actor,ruta){
 if(!actor||!ruta)throw Error('Usuario y ruta requeridos');
 return db.readTransaction(async tx=>{
  const operaciones=await tx.getAll('SELECT * FROM lc_ruta_cola112 WHERE actor=? AND ruta=? ORDER BY orden',[actor,ruta]);
  if(!operaciones.some(r=>r.estado==='CONFLICTO'))throw Error('La ruta no tiene un conflicto local registrado');
  const pedidos=(await tx.getAll('SELECT * FROM lc_cola_local WHERE actor=?',[actor])).filter(r=>JSON.parse(r.solicitud).p_pedido?.ruta_id===ruta);
  return {formato:'LCexpress-ruta-revision112',actor,ruta,exportado_en:new Date().toISOString(),operaciones,pedidos};
 });
}
export async function descargarEvidenciaRuta112(db,actor,ruta){
 const evidencia=await evidenciaRuta112(db,actor,ruta);
 const contenido=JSON.stringify(evidencia,null,2);
 const url=URL.createObjectURL(new Blob([contenido],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='LCexpress_revision_'+ruta.replace(/[^a-zA-Z0-9_-]/g,'_')+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
