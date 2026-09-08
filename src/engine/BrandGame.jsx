import {GameAssets} from './tactical/GameAssets.jsx';
import {qualityProfile} from './tactical/quality.js';
import {Component,Suspense,useCallback,useEffect,useRef,useState} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {GameRuntime} from './GameRuntime.jsx';
import {createQuickBattle} from '../game/quickBattle.js';
import {QuickSelect} from './ui/QuickSelect.jsx';
import {getMap,listMaps} from './tactical/arena.js';
import {BattleHUD} from './tactical/BattleHUD.jsx';
import {createBattleSimulation,restoreBattleSimulation} from './tactical/simulation.js';
import {createAudioController,setMuted,playEffect} from '../game/audio.js';
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
export function BrandGame({request,onCheckpoint,onOutcome,onMenu,onRematch}) {
 const [assetProgress,setAssetProgress]=useState(0),[adaptiveLow,setAdaptiveLow]=useState(false);
 const assetError=useCallback(()=>{setReady(false);setError('Nie udało się wczytać modeli. Sprawdź połączenie i spróbuj ponownie.')},[]);
 const profile=qualityProfile('auto',typeof innerWidth==='number'?innerWidth:1000,adaptiveLow);
 const [sim,setSim]=useState(null),[snapshot,setSnapshot]=useState(null),[ready,setReady]=useState(false),[error,setError]=useState('');
 const [paused,setPaused]=useState(false),[retry,setRetry]=useState(0),[view,setView]=useState({mode:'move'}),[toolId,setToolId]=useState('pickaxe'),[notice,setNotice]=useState(''),[muted,setAudioMuted]=useState(true),[performance,setPerformance]=useState(null);
 const publishPerformance=useCallback(value=>{setPerformance(value);if(ready&&!paused&&value.fps<30&&value.p95>45)setAdaptiveLow(true)},[ready,paused]);
 const runtime=useRef(null),audio=useRef(null),pauseRef=useRef(false),savedTurn=useRef(0);pauseRef.current=paused;
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),4000);return ()=>clearTimeout(timer)},[notice]);
 const map=getMap(request.restore?.mapId??request.options.mapId);
 const pause=useCallback(value=>{runtime.current?.setPaused(value);pauseRef.current=value;setPaused(value);if(runtime.current){setSnapshot(runtime.current.snapshot({includeTerrain:false}));if(value)onCheckpoint?.(runtime.current.snapshot());}},[onCheckpoint]);
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
 useEffect(()=>()=>{audio.current?.context?.close?.()},[]);
 const onReady=useCallback(()=>{setReady(true);runtime.current?.setPaused(pauseRef.current)},[]);
 const onEvent=useCallback(event=>{
  if(event.type==='impact'||event.type==='shotgun')setNotice(event.damage?`Trafienie! −${event.damage} HP`:'Ziemia drży. Kogut jeszcze stoi.');
  if(event.type==='rope-release'&&event.payload.reason!=='manual')setNotice('Zaczep puścił. Możesz zarzucić lasso ponownie.');
  if(event.type==='tool')setNotice('Przejście gotowe. Możesz jeszcze strzelić.');
  if(event.type==='mine-place')setNotice('Mina odłożona. Uważaj na nią w kolejnej turze.');
  if(audio.current){const effect={shoot:'shoot',shotgun:'shoot',impact:'hit',won:'victory',lost:'defeat',tool:'hit'}[event.type];if(effect)playEffect(audio.current,effect)}
 },[]);
 const command=useCallback(cmd=>{const s=runtime.current;if(!s)return {accepted:false};if(cmd.type==='attack'||cmd.type==='pass')onCheckpoint?.(s.snapshot());const receipt=s.dispatch(cmd);
  if(!receipt.accepted&&!['move','rope.reel'].includes(cmd.type))setNotice(({blocked:'Tu nie ma podatnego materiału.',used:'Narzędzie było już użyte w tej turze.',empty:'Brak zapasu.',phase:'Poczekaj na swój ruch.',ground:'Stań na ziemi i zostaw miejsce na minę.','out-of-range':'Podejdź bliżej, żeby kopnąć.'})[receipt.reason]??'Tutaj się nie uda. Spróbuj innego miejsca.');
  if(receipt.accepted&&cmd.type==='tool')setView({mode:'move'});
  setSnapshot(s.snapshot({includeTerrain:false}));return receipt;
 },[onCheckpoint]);
 function toggleAudio(){audio.current??=createAudioController();setMuted(audio.current,!muted);setAudioMuted(!muted);if(muted)playEffect(audio.current,'treasure')}
 return <main className="brand-game battle-screen" aria-label="Arena KURCZOKER" data-map-id={map.id} data-quality={profile.id} data-dpr={profile.dpr} data-actors={JSON.stringify(snapshot?.actors??[])} data-battle-phase={snapshot?.phase??'loading'} data-sim-time={snapshot?.time} data-player-x={snapshot?.player.x} data-player-y={snapshot?.player.y} data-terrain-revision={sim?.terrain.revision??0} data-rope={snapshot?.rope?'attached':''} data-turn={snapshot?.turn} data-projectile-count={snapshot?.projectiles.length??0} data-mine-count={snapshot?.mines.length??0} data-selected-weapon={snapshot?.selectedWeaponId} data-performance={performance?JSON.stringify(performance):''}>
  <GameBoundary key={retry} onRetry={()=>setRetry(n=>n+1)}><Canvas frameloop={paused||snapshot?.outcome?'demand':'always'} orthographic camera={{position:[6,5,40],zoom:70,near:.1,far:160}} dpr={profile.dpr} shadows={profile.shadows} gl={{antialias:false,alpha:false,powerPreference:'high-performance'}} fallback={<div role="alert">Ta przeglądarka nie udostępnia WebGL2.</div>}>
   <Suspense fallback={null}><GameAssets onError={assetError} onProgress={setAssetProgress}>{sim&&<GameRuntime key={sim.options.encounterId} sim={sim} quality={profile} view={view} toolId={toolId} onView={setView} onCommand={command} onSnapshot={next=>{setSnapshot(next);if(next.phase==='player'&&next.turn!==savedTurn.current){savedTurn.current=next.turn;onCheckpoint?.(runtime.current.snapshot());}}} onEvent={onEvent} onReady={onReady} onOutcome={result=>onOutcome?.(result)}/>}</GameAssets></Suspense><Performance publish={publishPerformance}/>
  </Canvas></GameBoundary>
  {sim&&snapshot&&ready&&<BattleHUD sim={sim} snapshot={snapshot} onCommand={command} onPause={()=>pause(!pauseRef.current)} view={view} onView={setView} toolId={toolId} onTool={setToolId} notice={notice}/>}
  {!ready&&<div className="brand-modal"><section role={error?'alert':'status'}><h2>{error||'Przygotowujemy arenę…'}</h2><p>Modele: {Math.round(assetProgress*100)}%. Ostrzymy dzioby i sprawdzamy lasso.</p>{error&&<button onClick={()=>setRetry(n=>n+1)}>Spróbuj ponownie</button>}</section></div>}
  {paused&&<div className="brand-modal"><section role="dialog" aria-modal="true" aria-label="Pauza"><span className="brand-kicker">KURNIK MOŻE POCZEKAĆ</span><h2>Chwila przerwy.</h2><p>A/D lub strzałki: ruch. Spacja: skok. R: lasso. W/S: długość liny. Wybierz „Celuj”, ustaw kąt i moc, naciśnij „Strzel”.</p><button className="brand-primary" onClick={()=>pause(false)}>Wznów grę</button><button onClick={toggleAudio}>{muted?'Włącz dźwięk':'Wyłącz dźwięk'}</button><button onClick={()=>{if(runtime.current&&!runtime.current.outcome)onCheckpoint?.(runtime.current.snapshot());onMenu()}}>Wróć do menu</button></section></div>}
  {snapshot?.outcome&&!onOutcome&&<div className="brand-modal"><section role="dialog" aria-label="Wynik potyczki"><span className="brand-kicker">{snapshot.outcome==='won'?'PODWÓRZE JEST TWOJE':'TYM RAZEM KURNIK GÓRĄ'}</span><h2>{snapshot.outcome==='won'?'Pięknie poleciały pióra.':'Jeszcze jedno podejście?'}</h2><p>{snapshot.turn} tur · {Math.round(snapshot.time)} sekund gry</p><button className="brand-primary" onClick={onRematch}>Rewanż</button><button onClick={()=>{if(runtime.current&&!runtime.current.outcome)onCheckpoint?.(runtime.current.snapshot());onMenu()}}>Wróć do menu</button></section></div>}
 </main>;
}
