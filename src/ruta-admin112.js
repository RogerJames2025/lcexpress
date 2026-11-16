import {centroVentas112} from './venta-centro112.js';
import {panelVenta112} from './venta-tardia112.js';
import {centroCorrecciones112} from './ruta-centro112.js';
import {AutorizacionLocal112} from './autorizacion-local112.js';
// Importación para diagnóstico; nunca ejecuta las solicitudes del archivo.
export function validarEvidencia112(e){
 if(!e||e.formato!=='LCexpress-ruta-revision112'||typeof e.actor!=='string'||!e.actor||typeof e.ruta!=='string'||!e.ruta||!Array.isArray(e.operaciones)||!Array.isArray(e.pedidos)||e.operaciones.length<1||e.operaciones.length>500||e.pedidos.length>500)throw Error('Formato o tamaño de evidencia inválido');
 return e;
}
export async function panelRevision112(host,rpc){
 const {data,error}=await window.LC_SUPABASE.auth.getSession();if(error||!data?.session?.user?.id)throw Error('Sesión requerida');const actor=data.session.user.id;
 const guarded=async(name,args)=>{const {data,error}=await window.LC_SUPABASE.auth.getSession();if(error||data?.session?.user?.id!==actor)throw Error('Sesión cambió');return rpc(name,args)};
 const local=new AutorizacionLocal112(window.LCCloud.db,actor,guarded);
 const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text||'';return n};
 const file=el('input');file.type='file';file.accept='.json,application/json';
 const status=el('p','Seleccione el archivo exportado por el vendedor. Solo diagnóstico; no modifica datos.');status.setAttribute('role','status');
 const btn=el('button','Consultar confirmaciones oficiales');btn.type='button';const out=el('section');
 centroCorrecciones112(host,guarded);
 centroVentas112(host,guarded,window.LCCloud.db,actor);
 panelVenta112(host,guarded,window.LCCloud.db,actor);
 const pending=el('section');pending.append(el('h3','Solicitudes de este dispositivo'));host.append(pending,file,btn,status,out);
 const refresh=async()=>{pending.replaceChildren(el('h3','Solicitudes de este dispositivo'));for(const row of await local.listar()){
 const section=el('section');const b=el('button',row.estado==='PENDIENTE'?'Recuperar autorización '+row.ruta:'Consultar estado vigente '+row.ruta);b.type='button';section.append(b);pending.append(section);
 b.onclick=async()=>{b.disabled=true;try{
 if(row.estado==='PENDIENTE')await local.enviar(row.id);
 const r=await guarded('lc_estado_autorizacion112',{p_id:row.id});
 if(r?.id!==row.id||r.ruta!==row.ruta)throw Error('Respuesta de estado inválida');
 section.replaceChildren(b,el('p','Estado vigente: '+r.estado));
 if(r.estado==='REVOCADA')section.append(el('p','Motivo: '+r.motivo_revocacion+' · '+r.revocado_en));
 if(r.estado==='AUTORIZADA'){
 const form=el('form');const label=el('label','Motivo de revocación');const reason=el('input');reason.required=true;reason.minLength=10;reason.maxLength=1000;label.append(reason);const revoke=el('button','Revocar autorización');revoke.type='submit';form.append(label,revoke);section.append(form);
 form.onsubmit=async ev=>{ev.preventDefault();if(revoke.disabled)return;revoke.disabled=true;try{
 const m=reason.value.trim();if(m.length<10)throw Error('Motivo mínimo de 10 caracteres');
 if(!await window.LCDialog.confirm('¿Revocar esta autorización? No se eliminará la evidencia original.'))return;
 const result=await guarded('lc_revocar_correccion112',{p_id:row.id,p_motivo:m});if(result?.id!==row.id||result.estado!=='REVOCADA')throw Error('Respuesta de revocación inválida');status.textContent='Autorización revocada. Evidencia conservada.';await refresh();
 }catch(err){status.textContent=err.message+' · Consulte nuevamente el estado vigente antes de reintentar.';}finally{revoke.disabled=false}};
 }
 }catch(err){status.textContent=err.message;}finally{b.disabled=false}};
 }};await refresh();
 btn.onclick=async()=>{btn.disabled=true;out.replaceChildren();try{
 const f=file.files[0];if(!f||f.size>5000000)throw Error('Seleccione un JSON de hasta 5 MB');
 const e=validarEvidencia112(JSON.parse(await f.text()));
 const r=await rpc('lc_revision_ruta112',{p_evidencia:e});
 if(r?.ruta!==e.ruta||!Array.isArray(r.operaciones))throw Error('Respuesta de diagnóstico inválida');
 status.textContent='Consulta oficial realizada. No se modificaron registros.';
 out.append(el('h3','Ruta '+r.ruta),el('p',r.oficial?'Estado oficial: '+r.oficial.estado+' · '+r.oficial.codigo:'No existe ruta oficial con ese identificador.'));
 const t=el('table');for(const row of [['Operación','Tipo','Resultado'],...r.operaciones.map(x=>[x.id,x.tipo,x.estado])]){const tr=el('tr');for(const v of row)tr.append(el('td',String(v)));t.append(tr)}const wrap=el('div');wrap.className='lc111-table';wrap.append(t);out.append(wrap,el('p','SIN_CONFIRMACION no demuestra que la venta nunca ocurrió por otra operación. No reenviar ni corregir automáticamente.'));

 if(!r.oficial&&r.operaciones.every(x=>x.estado==='SIN_CONFIRMACION')){
 const openings=e.operaciones.filter(x=>JSON.parse(x.solicitud).p_accion==='ABRIR');
 if(openings.length===1&&openings[0].estado==='CONFLICTO'){
 const original=JSON.parse(openings[0].solicitud).p_datos;
 const closes=e.operaciones.filter(x=>JSON.parse(x.solicitud).p_accion==='CERRAR');
 if(closes.length>1)throw Error('Más de un cierre en evidencia');
 const catalog=await rpc('lc_gestion111_consultar');
 const form=el('form');form.className='lc111-form';
 const field=(label,type,value)=>{const l=el('label',label),n=el(type==='select'?'select':'input');if(type!=='select')n.type=type;n.value=value??'';n.required=true;l.append(n);form.append(l);return n};
 const vehicle=field('Vehículo realmente utilizado','select','');const blank=el('option','Seleccione');blank.value='';vehicle.append(blank);
 for(const v of catalog.vehiculos.filter(v=>v.activo!==false)){const o=el('option',v.placa+' · '+v.descripcion);o.value=v.id;vehicle.append(o)}
 const km=field('Kilometraje inicial real','number',original.km);km.min='0';km.step='0.1';
 const kf=closes.length?field('Kilometraje final real','number',JSON.parse(closes[0].solicitud).p_datos.km):null;if(kf){kf.min='0';kf.step='0.1'}
 const reason=field('Motivo de corrección','text','');reason.minLength=10;reason.maxLength=1000;
 const save=el('button','Autorizar corrección');save.type='submit';form.append(save);out.append(form);
 let request=null;
 form.onsubmit=async ev=>{ev.preventDefault();if(save.disabled)return;save.disabled=true;try{
 if(!request){if(kf&&Number(kf.value)<Number(km.value))throw Error('Kilometraje final inferior al inicial');if(!await window.LCDialog.confirm('¿Autorizar estos datos reales? La ruta aún no se abrirá.'))return;
 request={p_id:crypto.randomUUID(),p_evidencia:e,p_correccion:{vehiculo:vehicle.value,km_inicio:km.value,km_fin:kf?kf.value:null},p_motivo:reason.value.trim()};for(const n of [vehicle,km,kf,reason].filter(Boolean))n.disabled=true;}
 await local.guardar(request);const result=await local.enviar(request.p_id);if(result?.id!==request.p_id||result.ruta!==e.ruta||!['AUTORIZADA','APLICADA','REVOCADA'].includes(result.estado))throw Error('Respuesta de autorización inválida');status.textContent='Autorización '+result.estado+' · '+result.id;form.remove();await refresh();
 }catch(err){status.textContent=err.message+(request?' · Reintente la misma autorización o vuelva a diagnosticar antes de cambiar datos.':'');}finally{save.disabled=false}};
 }}
 }catch(e){status.textContent=e.message}finally{btn.disabled=false}};
}
