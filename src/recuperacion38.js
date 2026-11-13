// Importación explícita de evidencia; no ejecuta automáticamente los registros del archivo.
export async function recuperar38(sb,actor){
 const f=await new Promise(resolve=>{const i=document.createElement('input');i.type='file';i.accept='.json,application/json';i.onchange=()=>resolve(i.files[0]);i.oncancel=()=>resolve(null);i.click();});if(!f)return;
 const bytes=await f.arrayBuffer();const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 const raw=JSON.parse(new TextDecoder().decode(bytes));const ops=raw.operaciones||raw.crud||[];const candidates=ops.filter(o=>o.table==='inventario_aportes'&&o.op==='PUT'&&o.opData).map(o=>({...o.opData,id:o.id}));
 // Raw ps_crud is preserved for manual extraction; do not guess its internal encoding.
 if(!candidates.length)throw Error('El archivo no contiene altas de aportes normalizadas en operaciones. Conserve el archivo original.');
 const id=prompt('Identificador exacto del aporte a recuperar:\n'+candidates.map(a=>a.id+' — '+a.producto_id+' — '+a.cantidad).join('\n'));if(!id)return;
 const matches=candidates.filter(a=>a.id===id);if(matches.length!==1)throw Error('Identificador ausente o ambiguo');const aporte=matches[0];
 const motivo=prompt('Verifique físicamente que estas unidades no están incluidas en otros aportes.\n'+JSON.stringify(aporte)+'\nMotivo y evidencia de verificación (mínimo 10 caracteres):');if(!motivo||motivo.trim().length<10)return;
 if(!confirm('Confirmo que revisé el conteo físico y la evidencia original, y que la recuperación no duplicará unidades. SHA-256: '+sha))return;
 const key='lc_recuperacion38_'+actor;let req=JSON.parse(localStorage.getItem(key)||'null');const datos={p_aporte:aporte,p_sha:sha,p_motivo:motivo,p_verificado:true};if(req){if(JSON.stringify({...req,p_operacion:undefined})!==JSON.stringify(datos))throw Error('Existe una recuperación pendiente; repita exactamente el archivo y motivo anteriores.');}else{req={p_operacion:crypto.randomUUID(),...datos};localStorage.setItem(key,JSON.stringify(req));}
 const {data,error}=await sb.rpc('lc_inv_recuperar38',req);if(error)throw error;if(!['RECUPERADO','YA_EXISTE'].includes(data?.estado))throw Error('Sin confirmación');localStorage.removeItem(key);alert(data.estado+' — '+data.id);
}
