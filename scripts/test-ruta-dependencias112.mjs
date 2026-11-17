import assert from 'node:assert/strict';
import {estadoRutaLocal,ventaPuedeEnviar,rutaLocalActiva} from '../src/ruta-dependencias112.js';
const actor='a',id='r112-test';let rows=[];const db={getAll:async()=>rows};
const row=(action,estado='PENDIENTE')=>({ruta:id,estado,solicitud:JSON.stringify({p_accion:action,p_datos:{nombre:'Prueba'}})});
rows=[row('ABRIR')];assert.equal(await ventaPuedeEnviar(db,actor,id),false);assert.equal((await rutaLocalActiva(db,actor,null)).id,id);
rows=[row('ABRIR','CONFIRMADO')];assert.equal(await ventaPuedeEnviar(db,actor,id),true);assert.equal(await rutaLocalActiva(db,actor,null),null);
rows.push(row('CERRAR'));assert.equal((await estadoRutaLocal(db,actor,id)).cierre,true);assert.equal(await rutaLocalActiva(db,actor,{id,estado:'ABIERTA'}),null);
rows=[row('ABRIR','CONFLICTO')];assert.equal(await ventaPuedeEnviar(db,actor,id),false);assert.equal(await rutaLocalActiva(db,actor,null),null);
console.log('8 assertions passed');

// Dos dispositivos con el mismo usuario: apertura oficial y otra apertura rechazada.
const oficial={id:'r112-oficial',estado:'ABIERTA',nombre:'1',codigo:'R00046',actor112:actor};
rows=[{...row('ABRIR','CONFLICTO'),ruta:'r112-rechazada'}];
assert.deepEqual(await rutaLocalActiva(db,actor,oficial),oficial);
assert.equal(await ventaPuedeEnviar(db,actor,oficial.id),true);
rows=[{...row('CERRAR','PENDIENTE'),ruta:oficial.id}];
assert.equal(await rutaLocalActiva(db,actor,oficial),null);
rows=[{...row('ABRIR','CONFLICTO'),ruta:oficial.id}];
assert.equal(await rutaLocalActiva(db,actor,oficial),null);
console.log('4 assertions adicionales pasadas');
