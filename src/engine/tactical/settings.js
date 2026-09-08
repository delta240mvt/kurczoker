export const SETTINGS_KEY='kurczoker.settings.v2';
const volume=(value,fallback)=>Number.isFinite(value)?Math.max(0,Math.min(1,value)):fallback;
export function normalizeSettings(raw={}){
 raw=raw&&typeof raw==='object'?raw:{};
 return {hudScale:raw.hudScale===1.25?1.25:1,leftHanded:raw.leftHanded===true,
  musicVolume:volume(raw.musicVolume,.2),effectsVolume:volume(raw.effectsVolume,.7),shake:raw.shake!==false,
  reducedMotion:raw.reducedMotion===true,quality:['auto','low','high'].includes(raw.quality)?raw.quality:'auto'};
}
export function readSettings(storage,reducedMotion=false){try{const text=storage?.getItem(SETTINGS_KEY);if(text)return normalizeSettings({...{reducedMotion},...JSON.parse(text)})}catch{}return normalizeSettings({reducedMotion})}
export function writeSettings(storage,value){try{storage.setItem(SETTINGS_KEY,JSON.stringify(normalizeSettings(value)));return true}catch{return false}}
export function cameraShake({time,hitAt,shake,reducedMotion}){
 const age=time-hitAt;if(!Number.isFinite(age)||!shake||reducedMotion||age<0||age>.2)return {x:0,y:0};const strength=.045*(1-age/.2);
 return {x:Math.sin(age*160)*strength,y:Math.sin(age*117)*strength*.6};
}
