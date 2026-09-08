import {useEffect,useState} from 'react';
import {useStore} from 'zustand';
import {createBrandStore} from './store/brandStore.js';
import {BrandGame} from './BrandGame.jsx';
import {QuickSelect} from './ui/QuickSelect.jsx';
import {ExpeditionMap} from './ui/ExpeditionMap.jsx';
import {RewardPanel} from './ui/RewardPanel.jsx';
import {ShopPanel} from './ui/ShopPanel.jsx';
import {ResultPanel} from './ui/ResultPanel.jsx';
import {listMaps} from './tactical/arena.js';
import {normalizeSettings,readSettings,writeSettings} from './tactical/settings.js';
import {GameDialog} from './ui/GameDialog.jsx';
import {SettingsPanel} from './ui/SettingsPanel.jsx';
import {createAudioController,disposeAudio,pauseAudio,setVolumes} from '../game/audio.js';
import '../styles/brand-game.css';
const newSeed=()=>Date.now()>>>0;
export function ExpeditionApp(){
 const [audioController]=useState(()=>createAudioController());
 const [settings,setSettings]=useState(()=>{const reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;try{return readSettings(localStorage,reducedMotion)}catch{return normalizeSettings({reducedMotion})}});
 const [settingsOpen,setSettingsOpen]=useState(false),[settingsError,setSettingsError]=useState(false);
 useEffect(()=>{setVolumes(audioController,{music:settings.musicVolume,effects:settings.effectsVolume})},[audioController,settings]);
 useEffect(()=>{const hidden=()=>{if(document.hidden)pauseAudio(audioController,true)};document.addEventListener('visibilitychange',hidden);return ()=>{document.removeEventListener('visibilitychange',hidden);disposeAudio(audioController)}},[audioController]);
 function changeSettings(next){const value=normalizeSettings(next);setSettings(value);try{setSettingsError(!writeSettings(localStorage,value))}catch{setSettingsError(true)}}
 const [store]=useState(()=>createBrandStore(newSeed())),state=useStore(store),{game,request}=state;
 const [page,setPage]=useState(()=>new URLSearchParams(location.search).get('mode')==='quick'?'quick':'expedition');
 const [mapId,setMapId]=useState(()=>{const id=new URLSearchParams(location.search).get('map');return listMaps().some(m=>m.id===id)?id:'yard'});
 const [confirm,setConfirm]=useState(false),[legacy,setLegacy]=useState(false);
 useEffect(()=>{state.inspectSave();try{setLegacy(['kurczoker-save','kurczoker.checkpoint.v1'].some(k=>localStorage.getItem(k)!==null))}catch{}
  if(new URLSearchParams(location.search).get('resume')==='1')state.resume();
 },[store]);
 function menu(){state.menu();state.inspectSave();pauseAudio(audioController,false)}
 function start(){if(state.savedAvailable&&game?.status!=='won'&&game?.status!=='lost'){setConfirm(true);return}state.startExpedition(newSeed())}
 const saveMessage=state.saveError||(state.saving?'Zapisujemy…':'Postęp zapisany w tej przeglądarce.');
 let content;
 if(request)content=<BrandGame key={request.serial} request={request} audioController={audioController} settings={settings} onSettings={changeSettings} settingsError={settingsError} onCheckpoint={state.checkpoint} onOutcome={state.mode==='expedition'?state.finishEncounter:undefined} onMenu={menu} onRematch={()=>state.startQuick(request.options.mapId,newSeed())}/>;
 else if(state.mode==='expedition'&&game){
  const props={game};content=<main className="brand-flow" data-scene={game.scene}>
   {game.scene==='map'&&<ExpeditionMap {...props} onSelect={state.selectRoute} onEnter={state.enterEncounter}/>}
   {game.scene==='reward'&&<RewardPanel {...props} onChoose={state.chooseReward}/>}
   {game.scene==='shop'&&<ShopPanel {...props} onBuy={state.buy} onLeave={state.leaveShop}/>}
   {game.scene==='result'&&<ResultPanel {...props} onExpedition={()=>state.startExpedition(newSeed())} onQuick={()=>{menu();setPage('quick')}}/>}
   {game.scene==='retry'&&<section className="brand-panel"><span className="brand-kicker">JESZCZE NIE KONIEC</span><h1>Otrzep pióra.</h1><p>Masz jedną drugą szansę na całą wyprawę. Wrócisz do początku tej walki z jej pierwotnym zdrowiem, terenem i zapasem.</p><button className="brand-primary" disabled={state.saving} onClick={state.retryEncounter}>Wykorzystaj drugą szansę</button></section>}
   {game.scene==='battle'&&!request&&<p role="status">Przygotowujemy drugą szansę…</p>}
   <button className="brand-menu-link" onClick={menu}>Wróć do menu</button>
  </main>;
 }else content=<div className="brand-entry"><nav aria-label="Tryb gry"><button aria-pressed={page==='quick'} onClick={()=>setPage('quick')}>Szybka potyczka</button><button aria-pressed={page==='expedition'} onClick={()=>setPage('expedition')}>Wyprawa</button>{state.savedAvailable&&<button disabled={state.loadingSave} onClick={state.resume}>Wznów wyprawę</button>}<button onClick={()=>setSettingsOpen(true)}>Ustawienia</button><a href="/">Strona gry</a></nav>
  {page==='quick'?<QuickSelect maps={listMaps()} selectedMapId={mapId} onSelect={setMapId} onStart={()=>state.startQuick(mapId,newSeed())}/>:<main className="brand-flow"><section className="brand-panel"><span className="brand-kicker">KURCZOKER / DELTA240MVT</span><h1>Piętnaście minut dla siebie.</h1><p>Trzy podwórza i Jajokról. Wybieraj trasę, zbieraj sprzęt i wróć z koroną. Grasz we własnym tempie.</p><button className="brand-primary" disabled={state.loadingSave} onClick={start}>Rozpocznij wyprawę</button>{legacy&&<p>Masz zapis starszej wersji. Zachowaliśmy go jako kopię; nowa gra zaczyna osobną wyprawę.</p>}</section></main>}
 </div>;
 return <>{content}{state.mode==='expedition'&&<div className={'brand-save-status'+(state.saveError?' is-error':'')} role={state.saveError?'alert':'status'}>{saveMessage}</div>}
  {state.mode==='menu'&&state.saveError&&<p className="brand-save-status is-error" role="alert">{state.saveError}</p>}
  {confirm&&<GameDialog title="Nowa wyprawa" onClose={()=>setConfirm(false)}><h2>Zacząć od początku?</h2><p>Nowa wyprawa zastąpi aktualny zapis postępu.</p><button className="brand-primary" onClick={()=>{setConfirm(false);state.startExpedition(newSeed())}}>Tak, nowa wyprawa</button><button onClick={()=>setConfirm(false)}>Zachowaj postęp</button></GameDialog>}
  {settingsOpen&&<GameDialog title="Ustawienia" onClose={()=>setSettingsOpen(false)}><SettingsPanel settings={settings} onChange={changeSettings} onClose={()=>setSettingsOpen(false)} error={settingsError}/></GameDialog>}
 </>;
}
