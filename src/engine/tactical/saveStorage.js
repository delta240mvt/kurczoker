export async function createSaveStorage(indexedDB){
 if(!indexedDB)throw new Error('Ta przeglądarka nie udostępnia zapisu IndexedDB.');
 const db=await new Promise((resolve,reject)=>{
  const request=indexedDB.open('kurczoker-v2',1);let settled=false;
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('saves'))request.result.createObjectStore('saves')};
  request.onerror=()=>{settled=true;reject(request.error??new Error('Nie udało się otworzyć zapisu.'))};
  request.onblocked=()=>{settled=true;reject(new Error('Zapis jest zablokowany przez inną kartę.'))};
  request.onsuccess=()=>{if(settled){request.result.close();return;}settled=true;resolve(request.result)};
 });
 db.onversionchange=()=>db.close();
 return {
  read(){return new Promise((resolve,reject)=>{
   const tx=db.transaction('saves','readonly'),store=tx.objectStore('saves'),latest=store.get('latest'),previous=store.get('previous');
   tx.oncomplete=()=>resolve({latest:latest.result??null,previous:previous.result??null});
   tx.onabort=()=>reject(tx.error??new Error('Nie udało się odczytać zapisu.'));
  })},
  write(encoded){
   if(typeof encoded!=='string'||encoded.length>8*1024**2)return Promise.reject(new Error('Niepoprawny rozmiar zapisu.'));
   return new Promise((resolve,reject)=>{
    const tx=db.transaction('saves','readwrite'),store=tx.objectStore('saves'),latest=store.get('latest');let error;
    tx.oncomplete=()=>resolve();tx.onerror=event=>{error??=event.target.error??tx.error};
    tx.onabort=()=>reject(error??tx.error??new Error('Zapis został przerwany.'));
    latest.onsuccess=()=>{
     try{if(latest.result!=null)store.put(latest.result,'previous');store.put(encoded,'latest')}
     catch(e){error=e;tx.abort()}
    };
   });
  },
  close(){db.close()},
 };
}
