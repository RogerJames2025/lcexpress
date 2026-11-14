import assert from 'node:assert/strict';
import { evidenciaRuta112 } from '../src/ruta-revision112.js';
const op={id:'a',actor:'u',ruta:'r',estado:'CONFLICTO',solicitud:'{}'};
const orders=[{id:'p',solicitud:JSON.stringify({p_pedido:{ruta_id:'r'}})},{id:'q',solicitud:JSON.stringify({p_pedido:{ruta_id:'otra'}})}];
const db={readTransaction:async fn=>fn({getAll:async(sql,args)=>{assert.equal(args[0],'u');return sql.includes('lc_ruta_cola112')?(args[1]==='r'?[op]:[]):orders;}})};
const result=await evidenciaRuta112(db,'u','r');assert.equal(result.operaciones.length,1);assert.equal(result.pedidos.length,1);assert.equal(result.pedidos[0].id,'p');assert.equal(result.formato,'LCexpress-ruta-revision112');await assert.rejects(()=>evidenciaRuta112(db,'u','otra'));await assert.rejects(()=>evidenciaRuta112(db,'','r'));console.log('6 comprobaciones correctas');
