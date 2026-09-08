const EFFECTS = {
  jump: {type:"triangle",frequency:260,endFrequency:620,duration:.12,gain:.045},
  rope: {type:"sine",frequency:780,endFrequency:260,duration:.15,gain:.045},
  shoot: { type: "square", frequency: 440, endFrequency: 660, duration: 0.08, gain: 0.05 },
  hit: { type: "sawtooth", frequency: 180, endFrequency: 90, duration: 0.12, gain: 0.07 },
  treasure: { type: "triangle", frequency: 660, endFrequency: 990, duration: 0.16, gain: 0.06 },
  defeat: { type: "sawtooth", frequency: 220, endFrequency: 55, duration: 0.35, gain: 0.08 },
  victory: { type: "triangle", frequency: 520, endFrequency: 1040, duration: 0.28, gain: 0.07 }
};

const clamp=(value,fallback)=>Number.isFinite(value)?Math.max(0,Math.min(1,value)):fallback;
function ensureContext(audio){
 if(!audio.AudioContext)return null;
 try{if(!audio.context){audio.context=new audio.AudioContext();audio.masterGain=audio.context.createGain();audio.masterGain.gain.value=audio.muted?0:audio.masterVolume;audio.masterGain.connect(audio.context.destination);
  audio.musicGain=audio.context.createGain();audio.effectsGain=audio.context.createGain();audio.musicGain.gain.value=audio.musicVolume;audio.effectsGain.gain.value=audio.effectsVolume;audio.musicGain.connect(audio.masterGain);audio.effectsGain.connect(audio.masterGain);
 }
 if(!audio.paused&&audio.context.state==='suspended')audio.context.resume?.()?.catch?.(()=>{});
 audio.unlocked=true;return audio.context;
 }catch{audio.AudioContext=null;return null}
}
export function createAudioController(options={}){
 return {muted:true,unlocked:false,context:null,masterGain:null,musicGain:null,effectsGain:null,masterVolume:options.masterVolume??.35,musicVolume:.2,effectsVolume:.7,paused:false,voices:new Set(),seenEvents:new Set(),musicTimer:null,musicWanted:false,musicIndex:0,
  AudioContext:options.AudioContext??(typeof window==='undefined'?null:window.AudioContext??window.webkitAudioContext)};
}
function tone(audio,effect,output){
 const context=audio.context,at=context.currentTime,end=at+effect.duration,oscillator=context.createOscillator(),gain=context.createGain();
 oscillator.type=effect.type;oscillator.frequency.setValueAtTime(effect.frequency,at);oscillator.frequency.exponentialRampToValueAtTime(effect.endFrequency??effect.frequency,end);
 gain.gain.setValueAtTime(effect.gain,at);gain.gain.exponentialRampToValueAtTime(.0001,end);
 oscillator.connect(gain);gain.connect(output);const voice={oscillator,gain};audio.voices.add(voice);
 oscillator.onended=()=>{oscillator.disconnect?.();gain.disconnect?.();audio.voices.delete(voice)};oscillator.start(at);oscillator.stop(end);
}
export function playEffect(audio,effectId){
 const effect=EFFECTS[effectId];if(!audio||audio.muted||audio.paused||!effect||!ensureContext(audio))return false;
 tone(audio,effect,audio.effectsGain);return true;
}
export function playGameEvent(audio,event){
 if(!audio)return false;const key=(event.encounterId??'')+':'+(event.id??event.type+'-'+event.time);if(audio.seenEvents.has(key))return false;audio.seenEvents.add(key);if(audio.seenEvents.size>256)audio.seenEvents.delete(audio.seenEvents.values().next().value);
 return playEffect(audio,{shoot:'shoot',shotgun:'shoot',impact:'hit',won:'victory',lost:'defeat',tool:'hit','mine-place':'treasure',jump:'jump','rope-attach':'rope'}[event.type]);
}
function stopVoices(audio){for(const {oscillator,gain} of audio.voices){try{oscillator.stop();oscillator.disconnect?.();gain.disconnect?.()}catch{}}audio.voices.clear();}
export function setVolumes(audio,{music,effects}){
 if(!audio)return;audio.musicVolume=clamp(music,.2);audio.effectsVolume=clamp(effects,.7);
 if(audio.context){audio.musicGain.gain.setValueAtTime(audio.musicVolume,audio.context.currentTime);audio.effectsGain.gain.setValueAtTime(audio.effectsVolume,audio.context.currentTime)}
}
const MOTIF=[261.63,329.63,392,0,440,392,329.63,0,293.66,349.23,440,392,329.63,293.66,261.63,0,329.63,392,523.25,0,493.88,440,392,0,349.23,329.63,293.66,0,392,329.63,261.63,0];
export function startMusic(audio){
 if(!audio)return;audio.musicWanted=true;if(audio.musicTimer||audio.paused||audio.muted||!ensureContext(audio))return;
 audio.musicTimer=setInterval(()=>{if(audio.paused||audio.muted)return;const frequency=MOTIF[audio.musicIndex++%MOTIF.length];if(frequency&&audio.musicVolume>0)tone(audio,{type:'triangle',frequency,duration:.3,gain:.03},audio.musicGain)},600);audio.musicTimer.unref?.();
}
export function setMuted(audio,muted){
 if(!audio)return audio;audio.muted=Boolean(muted);
 if(!audio.muted)ensureContext(audio);if(audio.masterGain)audio.masterGain.gain.value=audio.muted?0:audio.masterVolume;
 if(audio.muted){clearInterval(audio.musicTimer);audio.musicTimer=null;stopVoices(audio)}else if(audio.musicWanted)startMusic(audio);
 return audio;
}
export function pauseAudio(audio,paused){
 if(!audio)return;audio.paused=Boolean(paused);
 if(paused){clearInterval(audio.musicTimer);audio.musicTimer=null;stopVoices(audio);audio.context?.suspend?.()?.catch?.(()=>{})}
 else if(audio.unlocked){ensureContext(audio);if(audio.musicWanted)startMusic(audio)}
}
export function disposeAudio(audio){if(!audio)return;clearInterval(audio.musicTimer);audio.musicTimer=null;stopVoices(audio);audio.context?.close?.()?.catch?.(()=>{})}
