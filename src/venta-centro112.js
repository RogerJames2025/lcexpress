import {VentaAdminLocal112} from './venta-tardia112.js';
export function paginaVentas112(rows){
 if(!Array.isArray(rows)||rows.length>51||rows.some(r=>!r?.operacion||!r.creado||!r.pedido||!r.actor||!['AUTORIZADA','APLICADA','REVOCADA'].includes(r.estado)))throw Error('Listado comercial inválido');
 const items=rows.slice(0,50),last=items.at(-1);return {items,cursor:rows.length>50?{p_cursor_fecha:last.creado,p_cursor_id:last.operacion}:null};
}
export function centroVentas112(host,rpc,db,actorId){
 const local=new VentaAdminLocal112(db,actorId,rpc);
 const el=(tag,t='')=>{const n=document.createElement(tag);n.textContent=t;return n};
 const section=el('section'),form=el('form'),out=el('div'),status=el('p'),next=el('button','Página siguiente');form.className='lc111-form';status.setAttribute('role','status');next.type='button';next.hidden=true;
 const field=(name,type)=>{const l=el('label',name),n=el(type==='select'?'select':'input');if(type!=='select')n.type=type;l.append(n);form.append(l);return n};
 const actor=field('Vendedor (UUID)','text'),ruta=field('Ruta','text'),pedido=field('Pedido','text'),estado=field('Estado','select'),desde=field('Desde','date'),hasta=field('Hasta','date');ruta.maxLength=200;pedido.maxLength=200;
 for(const v of ['','AUTORIZADA','APLICADA','REVOCADA']){const o=el('option',v||'Todos');o.value=v;estado.append(o)}
 const search=el('button','Consultar ventas tardías');search.type='submit';form.append(search);section.append(el('h3','Centro de ventas tardías'),form,status,out,next);host.append(section);
 let filters=null,cursor=null,busy=false;
 const load=async(more=false)=>{if(busy)return;busy=true;search.disabled=next.disabled=true;out.replaceChildren();try{
 if(!more){const a=actor.value.trim();if(a&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a))throw Error('UUID inválido');if(desde.value&&hasta.value&&desde.value>hasta.value)throw Error('Intervalo inválido');filters={p_actor:a||null,p_ruta:ruta.value.trim()||null,p_pedido:pedido.value.trim()||null,p_estado:estado.value||null,p_desde:desde.value||null,p_hasta:hasta.value||null};cursor=null;}
 const page=paginaVentas112(await rpc('lc_listar_ventas_tardias112',{...filters,p_cursor_fecha:null,p_cursor_id:null,...cursor}));cursor=page.cursor;next.hidden=!cursor;
 for(const r of page.items){const box=el('section');box.append(el('h4',r.pedido+' · '+r.estado),el('p','Ruta: '+r.ruta+' · Vendedor: '+(r.vendedor_nombre||r.actor)),el('p','Operación: '+r.operacion+' · '+r.creado),el('p','Administrador: '+(r.administrador_nombre||r.administrador)+' · Motivo: '+r.motivo),el('p','Sustituye: '+(r.sustituye||'—')));if(r.revocado_en)box.append(el('p','Revocación: '+r.revocado_en+' · '+r.revocado_por+' · '+r.motivo_revocacion));
 const detail=el('button','Consultar evidencia y confirmación oficial');detail.type='button';const result=el('pre');result.style.whiteSpace='pre-wrap';box.append(detail,result);detail.onclick=async()=>{detail.disabled=true;try{const d=await rpc('lc_detalle_venta_tardia112',{p_operacion:r.operacion});if(d?.operacion!==r.operacion)throw Error('Detalle inválido');result.textContent=JSON.stringify(d,null,2);}catch(e){result.textContent=e.message;}finally{detail.disabled=false}};
 if(r.estado==='AUTORIZADA'){const f=el('form'),l=el('label','Motivo de revocación'),m=el('input'),b=el('button','Revocar autorización');m.required=true;m.minLength=10;m.maxLength=1000;b.type='submit';l.append(m);f.append(l,b);box.append(f);f.onsubmit=async ev=>{ev.preventDefault();if(b.disabled)return;b.disabled=true;try{const reason=m.value.trim();if(reason.length<10||reason.length>1000)throw Error('Motivo inválido');if(!await window.LCDialog.confirm('¿Revocar autorización comercial? La evidencia se conserva.'))return;const v=await local.enviar(await local.guardar({p_operacion:r.operacion,p_motivo:reason},'REVOCAR'));if(v?.operacion!==r.operacion||v.estado!=='REVOCADA')throw Error('Respuesta inválida');await load(false);}catch(e){status.textContent=e.message+' · Consulte nuevamente el estado oficial.';}finally{b.disabled=false}};}
 out.append(box);}status.textContent=page.items.length+' autorizaciones en esta página.';
 }catch(e){status.textContent=e.message;next.hidden=true;}finally{busy=false;search.disabled=next.disabled=false}};
 form.onsubmit=e=>{e.preventDefault();void load(false)};next.onclick=()=>{if(cursor)void load(true)};
}
