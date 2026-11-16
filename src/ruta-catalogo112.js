// Cache por usuario, exclusivamente local. Nunca confirma disponibilidad offline.
export async function consultarCatalogoRuta(actor,db,consultar){
 if(!actor)throw Error('Sesión requerida');
 let data;
 try {data=await consultar();} catch(e){
  // No ocultar errores de autorización ni respuestas de negocio.
  if(globalThis.navigator?.onLine!==false)throw e;
  if(!db)throw Error('Catálogo local no disponible');
  const row=await db.getOptional('SELECT datos,fecha FROM lc_ruta_catalogo112 WHERE id=? AND actor=?',[actor,actor]);
  if(!row)throw Error('Conéctese para descargar el catálogo de vehículos por primera vez.');
  const cached=JSON.parse(row.datos);
  return {...cached,provisional:true,fecha:row.fecha};
 }
 if(!data||!Array.isArray(data.vehiculos))throw Error('Catálogo inválido');
 const fecha=new Date().toISOString();
 if(db){try{await db.execute('INSERT OR REPLACE INTO lc_ruta_catalogo112(id,actor,datos,fecha) VALUES(?,?,?,?)',[actor,actor,JSON.stringify(data),fecha]);}catch(e){console.warn('No se pudo actualizar catálogo local',e);}}
 return {...data,provisional:false,fecha};
}
