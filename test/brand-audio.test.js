import test from 'node:test';
import assert from 'node:assert/strict';
import * as audioApi from '../src/game/audio.js';
class Context{
 constructor(){this.currentTime=1;this.destination={};this.state='suspended';this.gains=[];this.oscillators=[]}
 createGain(){const gain={gain:{value:1,setValueAtTime(value){this.value=value},exponentialRampToValueAtTime(){}},connect(node){this.output=node},disconnect(){}};this.gains.push(gain);return gain}
 createOscillator(){const oscillator={frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(node){this.output=node},start(){},stop(){this.stops=(this.stops??0)+1},disconnect(){}};this.oscillators.push(oscillator);return oscillator}
 resume(){this.state='running';return Promise.resolve()}suspend(){this.state='suspended';return Promise.resolve()}close(){return Promise.resolve()}
}
test('music and effects have separate gains and invalid values are clamped',()=>{
 assert.equal(typeof audioApi.setVolumes,'function');const audio=audioApi.createAudioController({AudioContext:Context});
 audioApi.setVolumes(audio,{music:.3,effects:.8});assert.equal(audio.context,null);audioApi.setMuted(audio,false);
 assert.notEqual(audio.musicGain,audio.effectsGain);assert.equal(audio.musicGain.gain.value,.3);assert.equal(audio.effectsGain.gain.value,.8);
 audioApi.setVolumes(audio,{music:3,effects:-1});assert.equal(audio.musicGain.gain.value,1);assert.equal(audio.effectsGain.gain.value,0);
});
test('events are deduplicated; pause stops active voices and drops paused events',()=>{
 const audio=audioApi.setMuted(audioApi.createAudioController({AudioContext:Context}),false);
 assert.equal(typeof audioApi.playGameEvent,'function');assert.equal(audioApi.playGameEvent(audio,{id:1,type:'shoot'}),true);assert.equal(audioApi.playGameEvent(audio,{id:1,type:'shoot'}),false);
 const voice=audio.context.oscillators[0],before=voice.stops;audioApi.pauseAudio(audio,true);assert.ok(voice.stops>before);assert.equal(audio.context.state,'suspended');
 assert.equal(audioApi.playGameEvent(audio,{id:2,type:'impact'}),false);audioApi.pauseAudio(audio,false);assert.equal(audioApi.playGameEvent(audio,{id:2,type:'impact'}),false);assert.equal(audioApi.playGameEvent(audio,{id:3,type:'impact'}),true);
 audioApi.disposeAudio(audio);
});
test('an unavailable audio device does not throw or block controls',()=>{
 const audio=audioApi.createAudioController({AudioContext:class{constructor(){throw new Error('Unavailable')}}});
 assert.doesNotThrow(()=>audioApi.setMuted(audio,false));assert.equal(audioApi.playEffect(audio,'shoot'),false);
});
test('the first shot of another encounter is audible even when numeric event IDs restart',()=>{
 const audio=audioApi.setMuted(audioApi.createAudioController({AudioContext:Context}),false);
 assert.equal(audioApi.playGameEvent(audio,{id:1,encounterId:'first',type:'shoot'}),true);
 assert.equal(audioApi.playGameEvent(audio,{id:1,encounterId:'second',type:'shoot'}),true);
 audioApi.disposeAudio(audio);
});
