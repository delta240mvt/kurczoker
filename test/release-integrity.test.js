import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {releaseFiles,verifyRelease} from '../tools/release-integrity.mjs';
test('release verification detects edited and extra deployment files',async()=>{
 const root=await mkdtemp(join(tmpdir(),'kurczoker-release-'));
 try{await writeFile(join(root,'index.html'),'tested');const report={sourceCommit:'a'.repeat(40),dirty:false,files:await releaseFiles(root)};await writeFile(join(root,'release-report.json'),JSON.stringify(report));assert.equal((await verifyRelease(root)).dirty,false);
  await writeFile(join(root,'index.html'),'changed');await assert.rejects(verifyRelease(root),/changed after build/);
  await writeFile(join(root,'index.html'),'tested');await writeFile(join(root,'extra.js'),'untested');await assert.rejects(verifyRelease(root),/changed after build/);
 }finally{await rm(root,{recursive:true,force:true})}
});
