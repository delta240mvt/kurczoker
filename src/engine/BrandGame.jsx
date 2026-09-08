import {GameAssets} from './tactical/GameAssets.jsx';
import {qualityProfile} from './tactical/quality.js';
import {Component,Suspense,useCallback,useEffect,useRef,useState} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {GameRuntime} from './GameRuntime.jsx';
import {getMap} from './tactical/arena.js';
import {BattleHUD} from './tactical/BattleHUD.jsx';
import {createBattleSimulation,restoreBattleSimulation} from './tactical/simulation.js';
import {createAudioController,setMuted,playEffect,playGameEvent,pauseAudio,startMusic,disposeAudio} from '../game/audio.js';
import {normalizeSettings} from './tactical/settings.js';
import {GameDialog} from './ui/GameDialog.jsx';
import {SettingsPanel} from './ui/SettingsPanel.jsx';
import {HelpPanel,TIPS} from './ui/HelpPanel.jsx';
import '../styles/brand-game.css';
class GameBoundary extends Component {
 state={error:false};static getDerivedStateFromError(){return {error:true}};
 render(){return this.state.error?<div className="brand-modal"><section role="alert"><h2>Scena potrzebuje restartu.</h2><p>Sprawdź obsługę WebGL2 i spróbuj ponownie.</p><button onClick={this.props.onRetry}>Spróbuj ponownie</button></section></div>:this.props.children;}
}
function Performance({publish}) {
 const {gl}=useThree(),samples=useRef([]),elapsed=useRef(0);
 useFrame((_,dt)=>{samples.current.push(dt*1000);elapsed.current+=dt;if(elapsed.current<2)return;
  const list=samples.current.sort((a,b)=>a-b);publish({fps:Math.round(list.length/elapsed.current),p95:Math.round(list[Math.floor(list.length*.95)]),calls:gl.info.render.calls,triangles:gl.info.render.triangles});samples.current=[];elapsed.current=0;
 });return null;
}
export function BrandGame({request,onCheckpoint,onOutcome,onMenu,onRematch,settings=normalizeSettings(),onSettings,settingsError,audioController}) {
 const [panel,setPanel]=useState('pause'),[seenTips,setSeenTips]=useState(()=>{try{const value=JSON.parse(localStorage.getItem('kurczoker.help.v2'));return Array.isArray(value)?value:[]}catch{return []}});
 function tips(value){setSeenTips(value);try{localStorage.setItem('kurczoker.help.v2',JSON.stringify(value))}catch{}}
 const [assetProgress,setAssetProgress]=useState(0),[adaptiveLow,setAdaptiveLow]=useState(false);
 const assetError=useCallback(()=>{setReady(false);setError('Nie udało się wczytać modeli. Sprawdź połączenie i spróbuj ponownie.')},[]);
 const profile=qualityProfile(settings.quality,typeof innerWidth==='number'?innerWidth:1000,adaptiveLow);
 const [sim,setSim]=useState(null),[snapshot,setSnapshot]=useState(null),[ready,setReady]=useState(false),[error,setError]=useState('');
 const [paused,setPaused]=useState(false),[retry,setRetry]=useState(0),[view,setView]=useState({mode:'move'}),[toolId,setToolId]=useState('pickaxe'),[notice,setNotice]=useState(''),[muted,setAudioMuted]=useState(true),[performance,setPerformance]=useState(null);
 const publishPerformance=useCallback(value=>{setPerformance(value);if(ready&&!paused&&value.fps<30&&value.p95>45)setAdaptiveLow(true)},[ready,paused]);
 const runtime=useRef(null),audio=useRef(null),pauseRef=useRef(false),savedTurn=useRef(0),audioActivated=useRef(audioController?.unlocked??false);pauseRef.current=paused;audio.current??=audioController??createAudioController();
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),4000);return ()=>clearTimeout(timer)},[notice]);
 const map=getMap(request.restore?.mapId??request.options.mapId);
 const pause=useCallback(value=>{runtime.current?.setPaused(value);pauseRef.current=value;setPaused(value);setPanel('pause');pauseAudio(audio.current,value);if(runtime.current){setSnapshot(runtime.current.snapshot({includeTerrain:false}));if(value)onCheckpoint?.(runtime.current.snapshot());}},[onCheckpoint]);
 useEffect(()=>{
  let cancelled=false,owned;savedTurn.current=0;
  setReady(false);setError('');setAssetProgress(0);setAdaptiveLow(false);setSim(null);setSnapshot(null);setPaused(false);setView({mode:'move'});setNotice('');
  (request.restore?restoreBattleSimulation(request.restore):createBattleSimulation(request.options))
  .then(s=>{if(cancelled){s.dispose();return;}owned=s;runtime.current=s;onCheckpoint?.(s.snapshot());savedTurn.current=s.turn;s.setPaused(true);setSim(s);setSnapshot(s.snapshot({includeTerrain:false}));})
  .catch(()=>{if(!cancelled)setError('Nie udało się przygotować areny. Spróbuj jeszcze raz.');});
  return ()=>{cancelled=true;if(runtime.current===owned)runtime.current=null;owned?.dispose();};
 },[request,retry,onCheckpoint]);
 useEffect(()=>{const blur=()=>{if(runtime.current&&!runtime.current.outcome)pause(true)},hidden=()=>{if(document.hidden)blur()};
  window.addEventListener('blur',blur);document.addEventListener('visibilitychange',hidden);
  return ()=>{window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',hidden)};
 },[pause]);
 useEffect(()=>{setAudioMuted(audio.current.muted);const activate=()=>{if(audioActivated.current)return;audioActivated.current=true;pauseAudio(audio.current,pauseRef.current);setMuted(audio.current,false);setAudioMuted(false);startMusic(audio.current)};
  window.addEventListener('pointerdown',activate,{once:true,capture:true});window.addEventListener('keydown',activate,{once:true});return ()=>{window.removeEventListener('pointerdown',activate,true);window.removeEventListener('keydown',activate,true);if(!audioController)disposeAudio(audio.current)};
 },[audioController]);
 const onReady=useCallback(()=>{setReady(true);runtime.current?.setPaused(pauseRef.current);pauseAudio(audio.current,pauseRef.current)},[]);
 const onEvent=useCallback(event=>{
  if(event.type==='impact'||event.type==='shotgun')setNotice(event.damage?`Trafienie! −${event.damage} HP`:'Ziemia drży. Kogut jeszcze stoi.');
  if(event.type==='rope-release'&&event.payload.reason!=='manual')setNotice('Zaczep puścił. Możesz zarzucić lasso ponownie.');
  if(event.type==='tool')setNotice('Przejście gotowe. Możesz jeszcze strzelić.');
  if(event.type==='mine-place')setNotice('Mina odłożona. Uważaj na nią w kolejnej turze.');
  playGameEvent(audio.current,{...event,encounterId:runtime.current?.options.encounterId});
 },[]);
 const command=useCallback(cmd=>{const s=runtime.current;if(!s)return {accepted:false};if(cmd.type==='attack'||cmd.type==='pass')onCheckpoint?.(s.snapshot());const receipt=s.dispatch(cmd);
  if(!receipt.accepted&&!['move','rope.reel'].includes(cmd.type))setNotice(({blocked:'Tu nie ma podatnego materiału.',used:'Narzędzie było już użyte w tej turze.',empty:'Brak zapasu.',phase:'Poczekaj na swój ruch.',ground:'Stań na ziemi i zostaw miejsce na minę.','out-of-range':'Podejdź bliżej, żeby kopnąć.'})[receipt.reason]??'Tutaj się nie uda. Spróbuj innego miejsca.');
  if(receipt.accepted&&cmd.type==='tool')setView({mode:'move'});
  if(receipt.accepted&&cmd.type==='jump')playEffect(audio.current,'jump');
  if(receipt.accepted&&cmd.type==='rope.attach')playEffect(audio.current,'rope');
  setSnapshot(s.snapshot({includeTerrain:false}));return receipt;
 },[onCheckpoint]);
 function toggleAudio(){setMuted(audio.current,!muted);setAudioMuted(!muted);if(muted)startMusic(audio.current)}
 return <main className="brand-game battle-screen" aria-label="Arena KURCZOKER" data-shake={settings.shake&&!settings.reducedMotion?'on':'off'} data-map-id={map.id} data-quality={profile.id} data-dpr={profile.dpr} data-actors={JSON.stringify(snapshot?.actors??[])} data-battle-phase={snapshot?.phase??'loading'} data-sim-time={snapshot?.time} data-player-x={snapshot?.player.x} data-player-y={snapshot?.player.y} data-terrain-revision={sim?.terrain.revision??0} data-rope={snapshot?.rope?'attached':''} data-turn={snapshot?.turn} data-projectile-count={snapshot?.projectiles.length??0} data-mine-count={snapshot?.mines.length??0} data-selected-weapon={snapshot?.selectedWeaponId} data-performance={performance?JSON.stringify(performance):''}>
  <GameBoundary key={retry} onRetry={()=>setRetry(n=>n+1)}><Canvas frameloop={paused||snapshot?.outcome?'demand':'always'} orthographic camera={{position:[6,5,40],zoom:70,near:.1,far:160}} dpr={profile.dpr} shadows={profile.shadows} gl={{antialias:false,alpha:false,powerPreference:'high-performance'}} fallback={<span>Plansza gry 3D. Sterowanie znajduje się obok planszy.</span>}>
   <Suspense fallback={null}><GameAssets onError={assetError} onProgress={setAssetProgress}>{sim&&<GameRuntime key={sim.options.encounterId} sim={sim} quality={profile} settings={settings} view={view} toolId={toolId} onView={setView} onCommand={command} onSnapshot={next=>{setSnapshot(next);if(next.phase==='player'&&next.turn!==savedTurn.current){savedTurn.current=next.turn;onCheckpoint?.(runtime.current.snapshot());}}} onEvent={onEvent} onReady={onReady} onOutcome={result=>onOutcome?.(result)}/>}</GameAssets></Suspense><Performance publish={publishPerformance}/>
  </Canvas></GameBoundary>
  {sim&&snapshot&&ready&&<BattleHUD settings={settings} sim={sim} snapshot={snapshot} onCommand={command} onPause={()=>pause(!pauseRef.current)} view={view} onView={setView} toolId={toolId} onTool={setToolId} notice={notice}/>}
  {!ready&&<div className="brand-modal"><section role={error?'alert':'status'}><h2>{error||'Przygotowujemy arenę…'}</h2><p>Modele: {Math.round(assetProgress*100)}%. Ostrzymy dzioby i sprawdzamy lasso.</p>{error&&<button onClick={()=>setRetry(n=>n+1)}>Spróbuj ponownie</button>}</section></div>}
  {ready&&!paused&&!snapshot?.outcome&&snapshot?.phase==='player'&&!notice&&TIPS[view.mode]&&!seenTips.includes(view.mode)&&<aside className="brand-tip" aria-label="Wskazówka"><p>{TIPS[view.mode]}</p><div><button onClick={()=>tips([...seenTips,view.mode])}>Rozumiem</button><button onClick={()=>tips(Object.keys(TIPS))}>Pomiń wskazówki</button></div></aside>}
  {paused&&<GameDialog key={panel} title={panel==='settings'?'Ustawienia':panel==='help'?'Pomoc':'Pauza'} onClose={()=>panel==='pause'?pause(false):setPanel('pause')}>
   {panel==='settings'?<SettingsPanel settings={settings} onChange={onSettings} error={settingsError} onClose={()=>setPanel('pause')}/>:panel==='help'?<HelpPanel onClose={()=>pause(false)} onTips={()=>{tips([]);pause(false)}}/>:<><span className="brand-kicker">KURNIK MOŻE POCZEKAĆ</span><h2>Chwila przerwy.</h2><p>Gra stoi w miejscu. Możesz odetchnąć.</p><button className="brand-primary" onClick={()=>pause(false)}>Wznów grę</button><button onClick={()=>setPanel('settings')}>Ustawienia</button><button onClick={()=>setPanel('help')}>Pomoc</button><button onClick={toggleAudio}>{muted?'Włącz dźwięk':'Wyłącz dźwięk'}</button><button onClick={()=>{if(runtime.current&&!runtime.current.outcome)onCheckpoint?.(runtime.current.snapshot());onMenu()}}>Wróć do menu</button></>}
  </GameDialog>}
  {snapshot?.outcome&&!onOutcome&&<GameDialog title="Wynik potyczki" onClose={onMenu}><span className="brand-kicker">{snapshot.outcome==='won'?'PODWÓRZE JEST TWOJE':'TYM RAZEM KURNIK GÓRĄ'}</span><h2>{snapshot.outcome==='won'?'Pięknie poleciały pióra.':'Jeszcze jedno podejście?'}</h2><p>{snapshot.turn} tur · {Math.round(snapshot.time)} sekund gry</p><button className="brand-primary" onClick={onRematch}>Rewanż</button><button onClick={()=>{if(runtime.current&&!runtime.current.outcome)onCheckpoint?.(runtime.current.snapshot());onMenu()}}>Wróć do menu</button></GameDialog>}
 </main>;
}
