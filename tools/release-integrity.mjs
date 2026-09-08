import {readdir,readFile,stat} from 'node:fs/promises';
import {resolve,relative,join,sep} from 'node:path';
import {createHash} from 'node:crypto';
export async function releaseFiles(directory){
 const root=resolve(directory),result=[];
 async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isSymbolicLink())throw new Error('Release must not contain symlinks');if(entry.isDirectory())await walk(path);else{const name=relative(root,path).replaceAll('\\','/');if(name==='release-report.json')continue;const data=await readFile(path);result.push({path:name,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')})}}}
 await walk(root);return result.sort((a,b)=>a.path.localeCompare(b.path));
}
export async function verifyRelease(directory){
 const root=resolve(directory),report=JSON.parse(await readFile(join(root,'release-report.json'),'utf8'));
 if(!/^[a-f0-9]{40}$/.test(report.sourceCommit??'')||typeof report.dirty!=='boolean'||!Array.isArray(report.files)||!report.files.length)throw new Error('Missing source or file integrity metadata. Rebuild.');
 for(const file of report.files){const path=resolve(root,file.path);if(!path.startsWith(root+sep)||file.path.includes('\\')||(await stat(path)).size>25*1024**2)throw new Error('Invalid release file: '+file.path)}
 const actual=await releaseFiles(root);if(JSON.stringify(actual)!==JSON.stringify(report.files))throw new Error('Release changed after build. Rebuild and verify preview again.');return report;
}
