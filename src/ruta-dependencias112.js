// Dependencias locales: las operaciones de venta no pueden adelantarse a su apertura.
export async function estadoRutaLocal(db,actor,id){
 const rows=await db.getAll('SELECT * FROM lc_ruta_cola112 WHERE actor=? ORDER BY orden',[actor]);
 const own=rows.filter(r=>r.ruta===id);
 const apertura=own.find(r=>JSON.parse(r.solicitud).p_accion==='ABRIR');
 return {apertura,cierre:own.some(r=>JSON.parse(r.solicitud).p_accion==='CERRAR'),conflicto:own.some(r=>r.estado==='CONFLICTO')};
}
export async function ventaPuedeEnviar(db,actor,id){
 if(!id||!id.startsWith('r112-'))return true;
 const s=await estadoRutaLocal(db,actor,id);
 // Una ruta oficial de otro dispositivo no tiene apertura local: el servidor debe validar propiedad.
 return !s.apertura||s.apertura.estado==='CONFIRMADO';
}
export async function rutaLocalActiva(db,actor,oficial){
 const rows=await db.getAll('SELECT * FROM lc_ruta_cola112 WHERE actor=? ORDER BY orden',[actor]);
 let r=oficial;
 for(const row of rows){
  const a=JSON.parse(row.solicitud);
  if(a.p_accion==='ABRIR'&&row.estado!=='CONFIRMADO'){
   // Una apertura rechazada de este dispositivo no debe ocultar la ruta oficial
   // ya abierta por el mismo usuario en otro dispositivo.
   if(row.estado!=='CONFLICTO'&&!r){
    r={id:row.ruta,nombre:a.p_datos.nombre,codigo:'PROVISIONAL',estado:'ABIERTA',actor112:actor,provisional:true};
   }
  }
  // Solo las operaciones que pertenecen a la ruta seleccionada pueden bloquearla.
  if(r?.id===row.ruta&&(a.p_accion==='CERRAR'||row.estado==='CONFLICTO'))r=null;
 }
 return r;
}
