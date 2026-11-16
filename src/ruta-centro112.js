export function paginaCorrecciones112(rows){
 if(!Array.isArray(rows)||rows.length>51||rows.some(r=>!r?.id||!r.creado||!['AUTORIZADA','APLICADA','REVOCADA'].includes(r.estado)))throw Error('Respuesta de listado inválida');
 const items=rows.slice(0,50),last=items.at(-1);return {items,cursor:rows.length>50?{p_cursor_fecha:last.creado,p_cursor_id:last.id}:null};
}
export function centroCorrecciones112(host,rpc){
 const el=(tag,t='')=>{const n=document.createElement(tag);n.textContent=t;return n};
 const section=el('section'),form=el('form'),out=el('div'),status=el('p'),next=el('button','Página siguiente');status.setAttribute('role','status');form.className='lc111-form';next.type='button';next.hidden=true;
 const field=(name,type)=>{const l=el('label',name),n=el(type==='select'?'select':'input');if(type!=='select')n.type=type;l.append(n);form.append(l);return n};
 const actor=field('Vendedor (UUID opcional)','text'),ruta=field('Identificador de ruta','text'),estado=field('Estado','select'),desde=field('Desde','date'),hasta=field('Hasta','date');ruta.maxLength=200;
 for(const v of ['','AUTORIZADA','APLICADA','REVOCADA']){const o=el('option',v||'Todos');o.value=v;estado.append(o)}
 const search=el('button','Consultar autorizaciones oficiales');search.type='submit';form.append(search);section.append(el('h3','Centro de autorizaciones oficiales'),form,status,out,next);host.append(section);
 let filters=null,cursor=null,busy=false;
 const load=async(more=false)=>{if(busy)return;busy=true;search.disabled=next.disabled=true;try{
 if(!more){const a=actor.value.trim();if(a&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a))throw Error('UUID de vendedor inválido');if(desde.value&&hasta.value&&desde.value>hasta.value)throw Error('Intervalo de fechas inválido');filters={p_actor:a||null,p_ruta:ruta.value.trim()||null,p_estado:estado.value||null,p_desde:desde.value||null,p_hasta:hasta.value||null};cursor=null;}
 const page=paginaCorrecciones112(await rpc('lc_listar_correcciones112',{...filters,p_cursor_fecha:null,p_cursor_id:null,...cursor}));out.replaceChildren();cursor=page.cursor;next.hidden=!cursor;
 for(const r of page.items){const box=el('section');box.append(el('h4',r.ruta+' · '+r.estado),el('p','Vendedor: '+(r.vendedor||r.actor)+' · '+r.actor),el('p','Administrador: '+(r.nombre_administrador||r.administrador)+' · '+r.creado),el('p','Vehículo: '+(r.placa||r.correccion?.vehiculo||'—')+' · km '+r.correccion?.km_inicio+' / '+(r.correccion?.km_fin??'Sin cierre')),el('p','Motivo: '+r.motivo));
 if(r.estado==='REVOCADA')box.append(el('p','Revocación: '+r.motivo_revocacion+' · '+(r.nombre_revocador||r.revocado_por)+' · '+r.revocado_en));
 if(r.estado==='AUTORIZADA'){const f=el('form'),l=el('label','Motivo de revocación'),m=el('input'),b=el('button','Revocar autorización');m.required=true;m.minLength=10;m.maxLength=1000;b.type='submit';l.append(m);f.append(l,b);box.append(f);f.onsubmit=async ev=>{ev.preventDefault();if(b.disabled)return;b.disabled=true;try{const reason=m.value.trim();if(reason.length<10||reason.length>1000)throw Error('Motivo inválido');if(!await window.LCDialog.confirm('¿Revocar esta autorización oficial?'))return;const result=await rpc('lc_revocar_correccion112',{p_id:r.id,p_motivo:reason});if(result?.id!==r.id||result.estado!=='REVOCADA')throw Error('Respuesta inválida');await load(false);status.textContent='Revocación confirmada. '+status.textContent;}catch(e){status.textContent=e.message+' · Consulte el estado oficial antes de reintentar.';}finally{b.disabled=false}};}
 out.append(box);}
 status.textContent=page.items.length+' autorizaciones en esta página.';
 }catch(e){status.textContent=e.message;next.hidden=true;}finally{busy=false;search.disabled=next.disabled=false}};
 form.onsubmit=e=>{e.preventDefault();void load(false)};next.onclick=()=>{if(cursor)void load(true)};
}
