/* Shared LCexpress dialogs; alerts queue, decisions must be awaited. */
(()=>{
 let tail=Promise.resolve();
 const make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);return n;};
 function show(kind,message,initial=''){
  return new Promise(resolve=>{
   const previous=document.activeElement,d=make('dialog');d.className='lc111-dialog lc112-message';d.style.width='min(500px,94vw)';
   const header=make('header'),title=make('h2',kind==='alert'?'LCexpress · Aviso':kind==='confirm'?'LCexpress · Confirmación':'LCexpress · Información requerida');header.append(title);d.setAttribute('aria-label',title.textContent);
   const body=make('div');body.className='lc111-body';const msg=make('p',message);msg.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;margin:0';body.append(msg);
   const form=make('form');let input;if(kind==='prompt'){const label=make('label','Respuesta');input=make('textarea');input.rows=3;input.value=String(initial??'');label.append(input);form.append(label);}
   const actions=make('div');actions.style.cssText='display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px';
   let result=kind==='prompt'?null:false;const button=(label,type,path)=>{const b=make('button');b.type=type;const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',path);svg.append(p);b.append(svg,document.createTextNode(label));return b;};
   if(kind!=='alert'){const cancel=button('Cancelar','button','M6 6l12 12M18 6L6 18');cancel.style.background='#475569';cancel.onclick=()=>d.close();actions.append(cancel);}
   const ok=button(kind==='confirm'?'Confirmar':'Aceptar','submit','M5 12l4 4L19 6');actions.append(ok);form.append(actions);body.append(form);d.append(header,body);document.body.append(d);
   form.onsubmit=e=>{e.preventDefault();result=kind==='prompt'?input.value:true;d.close();};
   d.addEventListener('cancel',e=>{e.preventDefault();d.close();});
   d.addEventListener('close',()=>{d.remove();if(previous?.isConnected)previous.focus({preventScroll:true});resolve(result);},{once:true});
   try{d.showModal();(input||actions.firstElementChild).focus();}catch(e){d.remove();console.error(e);resolve(result);}
  });
 }
 function enqueue(kind,message,initial){const next=tail.then(()=>show(kind,message,initial));tail=next.catch(()=>{});return next;}
 window.LCDialog=Object.freeze({alert:m=>enqueue('alert',m),confirm:m=>enqueue('confirm',m),prompt:(m,v)=>enqueue('prompt',m,v)});
})();
