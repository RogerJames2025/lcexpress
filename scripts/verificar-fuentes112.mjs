import {readdirSync,readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const files=readdirSync('src').filter(x=>x.endsWith('.js')).map(x=>'src/'+x);
for(const f of [...files,'public/sw.js','public/lc-dialog112.js','public/lc-config.js','vite.config.js']){
 const r=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
 const s=readFileSync(f,'utf8');for(const m of s.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g))assert.ok(existsSync(resolve(dirname(f),m[1])),`${f}: ${m[1]}`);
}
const html=readFileSync('index.html','utf8');let n=0;
for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
 const src=m[1].match(/\bsrc=['"]([^'"]+)['"]/);if(src){if(!/^https?:/.test(src[1])){const p=src[1].replace(/^\//,'');assert.ok(existsSync(p)||existsSync('public/'+p),p);}continue;}
 const r=spawnSync(process.execPath,['--check','--input-type=module'],{input:m[2],encoding:'utf8'});assert.equal(r.status,0,r.stderr);n++;
}
assert.match(readFileSync('public/lc-config.js','utf8'),/"releaseApproved":\s*true/);
assert.equal(readFileSync('sw.js','utf8'),readFileSync('public/sw.js','utf8'),'SW duplicados divergentes');
console.log(`${files.length} módulos, ${n} scripts inline, referencias locales y configuración de producción verificados`);
