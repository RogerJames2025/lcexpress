// Lectura informativa; nunca escribe puntos ni permite canje.
const cache=new Map();
const key=(actor,cliente,pedido)=>JSON.stringify([actor,cliente,pedido||null]);
function entero(n){return n!==null&&n!==''&&Number.isSafeInteger(Number(n));}
export async function consultar(cliente,pedido=null){
 const sb=window.LC_SUPABASE;if(!sb)throw Error('Servicio no disponible');
 const {data:s,error:se}=await sb.auth.getSession();const actor=s?.session?.user?.id;if(se||!actor)throw Error('Sesión requerida');
 const k=key(actor,cliente,pedido);try{
 if(!navigator.onLine)throw Error('Sin conexión');
 const {data,error}=await sb.rpc('lc_fidelizacion26',{p_cliente_id:cliente,p_pedido_id:pedido});if(error)throw error;
 const {data:actual}=await sb.auth.getSession();if(actual?.session?.user?.id!==actor)throw Error('Sesión cambiada');
 if(data?.cliente_id!==cliente||!entero(data.saldo)||!Array.isArray(data.historial)||!data.consultado_en||(data.pedido&&(!entero(data.pedido.puntos)||data.pedido.id!==pedido)))throw Error('Respuesta inválida');
 cache.set(k,data);try{localStorage.setItem("lc.puntos32."+k,JSON.stringify({cliente_id:data.cliente_id,saldo:data.saldo,consultado_en:data.consultado_en,historial:[],pedido:null}));}catch{}return {...data,cache:false};
 }catch(e){const {data:actual}=await sb.auth.getSession();if(actual?.session?.user?.id!==actor)throw Error('Sesión cambiada');if(!navigator.onLine){if(cache.has(k))return {...cache.get(k),cache:true};try{const d=JSON.parse(localStorage.getItem("lc.puntos32."+k)||"null");if(d&&d.cliente_id===cliente&&entero(d.saldo))return {...d,cache:true};}catch{}}throw e;}
}
export function estimar(total,original=null,oficial=null){const n=Number(total);if(!Number.isFinite(n)||n<0)return null;const objetivo=Math.floor(Math.round(n*10000)/10000);if(!original)return {objetivo,delta:objetivo};if(!oficial||oficial.id!==original.id||!entero(oficial.puntos))return null;if(!oficial.elegible)return {objetivo:0,delta:0};return {objetivo,delta:objetivo-Number(oficial.puntos)};}
function nodo(tag,text){const e=document.createElement(tag);e.textContent=text;return e;}
export async function panel(host,cliente,pedido=null){if(!host)return;const token=Symbol();host._puntos26=token;host.replaceChildren(nodo('p','Consultando puntos…'));try{const d=await consultar(cliente,pedido);if(host._puntos26!==token)return;host.replaceChildren(nodo('h3','Programa de puntos'),nodo('p',`${d.saldo} puntos · $${(Number(d.saldo)/100).toFixed(2)}`),nodo('small',`${d.cache?'Última consulta guardada (puede estar desactualizada)':'Consulta oficial'}: ${new Date(d.consultado_en).toLocaleString()} · Canje sujeto a saldo oficial`));if(pedido)host.append(nodo('p',d.pedido?`Puntos netos del pedido: ${d.pedido.puntos}`:'Pedido sin confirmación disponible'));const b=nodo('button','Ver últimos 50 movimientos');b.type='button';const list=nodo('div','');list.hidden=true;b.onclick=()=>{list.hidden=!list.hidden;};for(const m of d.historial)list.append(nodo('p',`${new Date(m.creado_en).toLocaleString()} · ${m.tipo} · ${Number(m.puntos)>0?'+':''}${m.puntos} · ${m.pedido_id||'—'}`));if(!d.historial.length)list.append(nodo('p',d.cache?'Historial no disponible en caché':'Sin movimientos registrados'));host.append(b,list);}catch(e){if(host._puntos26===token)host.replaceChildren(nodo('p','Puntos no disponibles. El saldo no se considera cero.'));}}
window.LCPuntos26={consultar,estimar,panel};
