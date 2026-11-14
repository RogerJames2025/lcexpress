/* Ejecutar en la consola de la aplicación ORIGINAL, con sesión iniciada.
   No instala ni abre otra base; no llama complete(), no borra datos. */
(async()=>{
 const cloud=window.LCCloud;if(!cloud?.db?.readTransaction)throw Error('La versión original no expone la base activa; no se puede garantizar exportación integral. No borre datos.');
 const db=cloud.db;const actor=await cloud.profile?.();
 const snapshot=await db.readTransaction(async tx=>{const raw=await tx.getAll('SELECT * FROM ps_crud ORDER BY id');const tables={};for(const t of ['inventarios','inventario_detalle','inventario_aportes','inventario_participantes','inventario_movimientos','productos','pedidos','pedido_detalle','clientes','rutas'])tables[t]=await tx.getAll('SELECT * FROM '+t);return {ps_crud:raw,tables};});
 const head=await db.getNextCrudTransaction();const out={formato:'LCexpress-produccion38',base_esperada:'lcexpress-v10.sqlite',fecha:new Date().toISOString(),perfil:actor?{id:actor.id}:null,...snapshot,operaciones:head?head.crud.map(o=>({table:o.table,id:o.id,op:o.op,opData:o.opData??null})):[],pendientes:JSON.parse(localStorage.getItem('lcexpress_offline_pending_v2')||'[]'),datos:JSON.parse(localStorage.getItem('lcexpress_offline_data_v2')||'{}')};
 const url=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='LCexpress_produccion38_'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
})().catch(e=>window.LCDialog ? window.LCDialog.alert('Exportación no completada: '+e.message) : console.error('Exportación no completada: '+e.message));
