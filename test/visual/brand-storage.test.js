import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {serveBuild} from './server.js';
test('IndexedDB: ostatnie dwie kopie, zapis równoległy i rollback po błędzie quota',{timeout:90000},async()=>{
 const source=await readFile('src/engine/tactical/saveStorage.js','utf8');
 const host=await serveBuild(),browser=await chromium.launch();try{
  const page=await browser.newPage();await page.goto(host.url+'/storage-test');
  await page.addScriptTag({type:'module',content:source+'\nwindow.createSaveStorage=createSaveStorage;'});
  await page.waitForFunction(()=>typeof window.createSaveStorage==='function');
  const result=await page.evaluate(async()=>{
   const storage=await window.createSaveStorage(indexedDB);await storage.write('A');await storage.write('B');const first=await storage.read();
   await Promise.all([storage.write('C'),storage.write('D')]);const parallel=await storage.read();
   const original=IDBObjectStore.prototype.put;let error;
   IDBObjectStore.prototype.put=function(value,key){if(key==='latest')throw new DOMException('Simulated quota failure','QuotaExceededError');return original.call(this,value,key)};
   try{await storage.write('E')}catch(e){error=e.name}finally{IDBObjectStore.prototype.put=original}
   const afterFailure=await storage.read();storage.close();const reopened=await window.createSaveStorage(indexedDB),afterReopen=await reopened.read();reopened.close();
   return {first,parallel,error,afterFailure,afterReopen};
  });
  assert.deepEqual(result.first,{latest:'B',previous:'A'});assert.deepEqual(result.parallel,{latest:'D',previous:'C'});
  assert.equal(result.error,'QuotaExceededError');assert.deepEqual(result.afterFailure,result.parallel);assert.deepEqual(result.afterReopen,result.parallel);
 }finally{await browser.close();await host.close()}
});
