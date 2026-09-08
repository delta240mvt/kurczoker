import {Component,Suspense,useCallback,useEffect,useRef,useState} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {GameRuntime} from './GameRuntime.jsx';
import {getMap} from './tactical/arena.js';
import {BattleHUD} from './tactical/BattleHUD.jsx';
import {createBattleSimulation} from './tactical/simulation.js';
import {createAudioController,setMuted,playEffect} from '../game/audio.js';
import '../styles/brand-game.css';
class GameBoundary extends Component {
 state={error:false};static getDerivedStateFromError(){return {error:true}};
 render(){return this.state.error?<div className="brand-modal"><section role="alert"><h2>Scena potrzebuje restartu.</h2><p>Sprawdź obsługę WebGL2 i spróbuj ponownie.</p><button onClick={()=>location.reload()}>Spróbuj ponownie</button></section></div>:this.props.children;}
}
function Performance({publish}) {
 const {gl}=useThree(),samples=useRef([]),elapsed=useRef(0);
 useFrame((_,dt)=>{samples.current.push(dt*1000);elapsed.current+=dt;if(elapsed.current<2)return;
  const list=samples.current.sort((a,b)=>a-b);publish({fps:Math.round(list.length/elapsed.current),p95:Math.round(list[Math.floor(list.length*.95)]),calls:gl.info.render.calls,triangles:gl.info.render.triangles});samples.current=[];elapsed.current=0;
 });return null;
}
export function BrandGame() {
 const [started,setStarted]=useState(false),[sim,setSim]=useState(null),[snapshot,setSnapshot]=useState(null),[ready,setReady]=useState(false),[error,setError]=useState('');
 const [paused,setPaused]=useState(false),[retry,setRetry]=useState(0),[view,setView]=useState({mode:'move'}),[toolId,setToolId]=useState('pickaxe'),[notice,setNotice]=useState(''),[muted,setAudioMuted]=useState(true),[performance,setPerformance]=useState(null);
 const runtime=useRef(null),audio=useRef(null),pauseRef=useRef(false);pauseRef.current=paused;
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),4000);return ()=>clearTimeout(timer)},[notice]);
 const map=getMap('yard');
 const pause=useCallback(value=>{runtime.current?.setPaused(value);pauseRef.current=value;setPaused(value);if(runtime.current)setSnapshot(runtime.current.snapshot({includeTerrain:false}));},[]);
 useEffect(()=>{
  if(!started)return;let cancelled=false,owned;
  setReady(false);setError('');setSim(null);setSnapshot(null);setPaused(false);setView({mode:'move'});setNotice('');
  createBattleSimulation({map,mode:'quick',encounterId:'quick-yard-'+retry,seed:1,
   player:{health:100,maxHealth:100,upgrades:[],inventory:{owned:['jajooka','kick'],ammo:{},tools:{pickaxe:2,drill:2}}}})
  .then(s=>{if(cancelled){s.dispose();return;}owned=s;runtime.current=s;s.setPaused(true);setSim(s);setSnapshot(s.snapshot({includeTerrain:false}));})
  .catch(()=>{if(!cancelled)setError('Nie udało się przygotować areny. Spróbuj jeszcze raz.');});
  return ()=>{cancelled=true;if(runtime.current===owned)runtime.current=null;owned?.dispose();};
 },[started,retry]);
 useEffect(()=>{const blur=()=>{if(runtime.current&&!runtime.current.outcome)pause(true)},hidden=()=>{if(document.hidden)blur()};
  window.addEventListener('blur',blur);document.addEventListener('visibilitychange',hidden);
  return ()=>{window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',hidden)};
 },[pause]);
 useEffect(()=>()=>{audio.current?.context?.close?.()},[]);
 const onReady=useCallback(()=>{setReady(true);runtime.current?.setPaused(pauseRef.current)},[]);
 const onEvent=useCallback(event=>{
  if(event.type==='impact')setNotice(event.damage?`Trafienie! −${event.damage} HP`:'Ziemia drży. Kogut jeszcze stoi.');
  if(event.type==='rope-release'&&event.payload.reason!=='manual')setNotice('Zaczep puścił. Możesz zarzucić lasso ponownie.');
  if(event.type==='tool')setNotice('Przejście gotowe. Możesz jeszcze strzelić.');
  if(audio.current){const effect={shoot:'shoot',impact:'hit',won:'victory',lost:'defeat',tool:'hit'}[event.type];if(effect)playEffect(audio.current,effect)}
 },[]);
 const command=useCallback(cmd=>{const s=runtime.current;if(!s)return {accepted:false};const receipt=s.dispatch(cmd);
  if(!receipt.accepted&&!['move','rope.reel'].includes(cmd.type))setNotice(({blocked:'Tu nie ma podatnego materiału.',used:'Narzędzie było już użyte w tej turze.',empty:'Brak zapasu.',phase:'Poczekaj na swój ruch.'})[receipt.reason]??'Tutaj się nie uda. Spróbuj innego miejsca.');
  if(receipt.accepted&&cmd.type==='tool')setView({mode:'move'});
  setSnapshot(s.snapshot({includeTerrain:false}));return receipt;
 },[]);
 function toggleAudio(){audio.current??=createAudioController();setMuted(audio.current,!muted);setAudioMuted(!muted);if(muted)playEffect(audio.current,'treasure')}
 if(!started)return <main className="brand-game-menu"><a className="brand-wordmark" href="/">KURCZOKER <small>GRA OD DELTA240MVT</small></a><section className="brand-start-card"><span className="brand-kicker">SZYBKA POTYCZKA · PODWÓRZE</span><h1>Pióra w ruch.<br/><em>Twoja kolej.</em></h1><p>Wskakuj na przeszkody, rozhuśtaj lasso i zrób przejście przez ziemię. Potem poślij jajobombę. Bez zegara nad głową.</p><div className="brand-start-steps"><span>01 / Ruch i skok</span><span>02 / Lasso i narzędzia</span><span>03 / Celuj i strzel</span></div><button className="brand-primary" onClick={()=>setStarted(true)}>Rozpocznij potyczkę</button><small>Telefon i komputer · Pion i poziom · Bez konta</small></section></main>;
 return <main className="brand-game battle-screen" aria-label="Arena KURCZOKER" data-battle-phase={snapshot?.phase??'loading'} data-sim-time={snapshot?.time} data-player-x={snapshot?.player.x} data-player-y={snapshot?.player.y} data-terrain-revision={sim?.terrain.revision??0} data-rope={snapshot?.rope?'attached':''} data-turn={snapshot?.turn} data-performance={performance?JSON.stringify(performance):''}>
  <GameBoundary key={retry}><Canvas frameloop={paused||snapshot?.outcome?'demand':'always'} orthographic camera={{position:[6,5,40],zoom:70,near:.1,far:160}} dpr={1} gl={{antialias:false,alpha:false,powerPreference:'high-performance'}} fallback={<div role="alert">Ta przeglądarka nie udostępnia WebGL2.</div>}>
   <Suspense fallback={null}>{sim&&<GameRuntime sim={sim} quality="low" view={view} toolId={toolId} onView={setView} onCommand={command} onSnapshot={setSnapshot} onEvent={onEvent} onReady={onReady} onOutcome={()=>{}}/>}</Suspense><Performance publish={setPerformance}/>
  </Canvas></GameBoundary>
  {sim&&snapshot&&ready&&<BattleHUD sim={sim} snapshot={snapshot} onCommand={command} onPause={()=>pause(!pauseRef.current)} view={view} onView={setView} toolId={toolId} onTool={setToolId} notice={notice}/>}
  {!ready&&<div className="brand-modal"><section role={error?'alert':'status'}><h2>{error||'Przygotowujemy podwórze…'}</h2><p>Ostrzymy dzioby i sprawdzamy lasso.</p>{error&&<button onClick={()=>setRetry(n=>n+1)}>Spróbuj ponownie</button>}</section></div>}
  {paused&&<div className="brand-modal"><section role="dialog" aria-modal="true" aria-label="Pauza"><span className="brand-kicker">KURNIK MOŻE POCZEKAĆ</span><h2>Chwila przerwy.</h2><p>A/D lub strzałki: ruch. Spacja: skok. R: lasso. W/S: długość liny. Wybierz „Celuj”, ustaw kąt i moc, naciśnij „Strzel”.</p><button className="brand-primary" onClick={()=>pause(false)}>Wznów grę</button><button onClick={toggleAudio}>{muted?'Włącz dźwięk':'Wyłącz dźwięk'}</button><button onClick={()=>setStarted(false)}>Wróć do menu</button></section></div>}
  {snapshot?.outcome&&<div className="brand-modal"><section role="dialog" aria-label="Wynik potyczki"><span className="brand-kicker">{snapshot.outcome==='won'?'PODWÓRZE JEST TWOJE':'TYM RAZEM KURNIK GÓRĄ'}</span><h2>{snapshot.outcome==='won'?'Pięknie poleciały pióra.':'Jeszcze jedno podejście?'}</h2><p>{snapshot.turn} tur · {Math.round(snapshot.time)} sekund gry</p><button className="brand-primary" onClick={()=>setRetry(n=>n+1)}>Rewanż</button><button onClick={()=>setStarted(false)}>Wróć do menu</button></section></div>}
 </main>;
}
