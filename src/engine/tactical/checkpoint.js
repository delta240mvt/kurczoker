import {validateCheckpoint} from './checkpointValidation.js';
export const SAVE_KEY='kurczoker.checkpoint.v2';
const LIMIT=8*1024**2;
async function hash(payload){const bytes=new TextEncoder().encode(payload),digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');}
export async function encodeCheckpoint(value){
 const reason=validateCheckpoint(value);if(reason)throw new Error('Niepoprawny zapis: '+reason);
 const payload=JSON.stringify(value),text=JSON.stringify({version:2,payload,checksum:await hash(payload)});
 if(new TextEncoder().encode(text).length>LIMIT)throw new Error('Zapis przekracza8MiB');return text;
}
export async function decodeCheckpoint(text){
 try{
  if(typeof text!=='string'||text.length>LIMIT||new TextEncoder().encode(text).length>LIMIT)return {ok:false,reason:'size'};
  const envelope=JSON.parse(text);if(envelope.version!==2)return {ok:false,reason:'version'};
  if(typeof envelope.payload!=='string'||!/^[a-f0-9]{64}$/.test(envelope.checksum??''))return {ok:false,reason:'envelope'};
  if(await hash(envelope.payload)!==envelope.checksum)return {ok:false,reason:'checksum'};
  const value=JSON.parse(envelope.payload),reason=validateCheckpoint(value);return reason?{ok:false,reason}:{ok:true,value};
 }catch{return {ok:false,reason:'format'}}
}
