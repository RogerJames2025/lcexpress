import {readFileSync, readdirSync, statSync, writeFileSync} from 'node:fs';
import {resolve, relative, sep} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve('dist');
function check(name){const p=resolve(root,name);if(!p.startsWith(root+sep)||!statSync(p).isFile()||!statSync(p).size)throw Error('Recurso inválido: '+name);return p;}
for(const name of ['index.html','sw.js','lc-config.js','manifest.webmanifest','icon-192.png','icon-512.png','lc-assets.json'])check(name);
const assets=JSON.parse(readFileSync(check('lc-assets.json'),'utf8'));
if(!Array.isArray(assets)||!assets.length)throw Error('Inventario de recursos vacío');
for(const name of assets) {if(typeof name!=='string'||!name.startsWith('assets/'))throw Error('Ruta inválida');check(name);}
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(resolve(d,e.name)):[resolve(d,e.name)]);
const files=walk(root).sort();
for(const p of files){const name=relative(root,p).split(sep).join('/');if(name.startsWith('assets/')&&!assets.includes(name))throw Error('Asset no incluido: '+name);}
writeFileSync('dist-sha256.txt',files.map(p=>createHash('sha256').update(readFileSync(p)).digest('hex')+'  '+relative(root,p).split(sep).join('/')).join('\n')+'\n');
console.log('Recursos verificados:',files.length,'; assets:',assets.length);
