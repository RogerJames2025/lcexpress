import assert from 'node:assert/strict';
import {estadoRutaLocal,ventaPuedeEnviar,rutaLocalActiva} from '../src/ruta-dependencias112.js';
const actor='a',id='r112-test';let rows=[];const db={getAll:async()=>rows};
const row=(action,estado='PENDIENTE')=>({ruta:id,estado,solicitud:JSON.stringify({p_accion:action,p_datos:{nombre:'Prueba'}})});
rows=[row('ABRIR')];assert.equal(await ventaPuedeEnviar(db,actor,id),false);assert.equal((await rutaLocalActiva(db,actor,null)).id,id);
rows=[row('ABRIR','CONFIRMADO')];assert.equal(await ventaPuedeEnviar(db,actor,id),true);assert.equal(await rutaLocalActiva(db,actor,null),null);
rows.push(row('CERRAR'));assert.equal((await estadoRutaLocal(db,actor,id)).cierre,true);assert.equal(await rutaLocalActiva(db,actor,{id,estado:'ABIERTA'}),null);
rows=[row('ABRIR','CONFLICTO')];assert.equal(await ventaPuedeEnviar(db,actor,id),false);assert.equal(await rutaLocalActiva(db,actor,null),null);
console.log('8 assertions passed');
