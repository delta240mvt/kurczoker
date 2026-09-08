import {useEffect,useMemo,useRef} from 'react';
import {WEAPONS} from './config.js';
import {createInputRouter,bindInput} from './input.js';
const PHASE={player:'Twój ruch. Bez pośpiechu.','player-shot':'Jajko w drodze…','enemy-tell':'Kogut szykuje atak','enemy-move':'Kogut zmienia pozycję','enemy-charge':'Jajokról szarżuje!','enemy-shot':'Uwaga, leci jajko!','enemy-resolve':'Opadają pióra…',settle:'Za chwilę Twój ruch',finished:'Potyczka rozstrzygnięta'};
export function BattleHUD({sim,snapshot,onCommand,onPause,view,onView,toolId,onTool,notice,settings={}}) {
 const current=useRef({onPause,onView,view,onCommand});current.current={onPause,onView,view,onCommand};
 const router=useMemo(()=>createInputRouter(command=>current.current.onCommand(command)),[]);
 const weapon=WEAPONS[snapshot.selectedWeaponId],ammo=snapshot.inventory.ammo[snapshot.selectedWeaponId];
 const ballistic=!['contact','mine'].includes(weapon.kind);
 const action=weapon.kind==='mine'?'Postaw minę':weapon.kind==='contact'?'Kopnij':'Strzel';
 const active=snapshot.phase==='player'&&!snapshot.paused&&!snapshot.outcome;
 useEffect(()=>{router.setMode(active?view.mode:'menu')},[active,view.mode,router]);
 useEffect(()=>bindInput({router,onPause:()=>{
  if(!['move','menu'].includes(current.current.view.mode))current.current.onView({mode:'move'});
  else current.current.onPause();
 },onRope:()=>{
  if(sim.rope.attached)current.current.onCommand({type:'rope.release'});
  else current.current.onView({mode:'rope'});
 }}),[sim,router]);
 const mode=next=>onView({...view,mode:next,ropeOverview:false});
 const overview=view.mode==='overview'||view.mode==='rope'&&view.ropeOverview;
 const hold=(action,label,icon)=> <button aria-label={label} disabled={!active}
  onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);router.press('pointer:'+e.pointerId,action)}}
  onPointerUp={e=>router.release('pointer:'+e.pointerId)} onPointerCancel={()=>router.clear()}
  onLostPointerCapture={e=>router.release('pointer:'+e.pointerId)}>{icon}<small>{label}</small></button>;
 const hero=snapshot.actors.find(a=>a.team==='player');
 const enemies=snapshot.actors.filter(a=>a.team==='enemy'&&a.alive);
 return <div className="brand-hud" data-scale={settings.hudScale??1} data-left-handed={settings.leftHanded??false}>
  <header className="brand-battle-top"><div><small>KURCZOKER · TURA {snapshot.turn}</small><strong>♥ {hero.health}<span> / {hero.maxHealth}</span></strong></div>
   <button aria-label="Pauza" onClick={onPause}>Ⅱ <span>Pauza</span></button></header>
  {!overview&&<div className="brand-phase" role="status">{snapshot.phase==='player'&&snapshot.boss?snapshot.boss.intent.label:snapshot.phase==='enemy-tell'&&snapshot.enemyPlan?({grenadier:'Grenadier szykuje granat',rusher:'Szturmowiec rusza do ataku',shooter:'Strzelec mierzy'})[snapshot.actors.find(a=>a.id===snapshot.activeEnemyId)?.role]??snapshot.enemyPlan.label??PHASE[snapshot.phase]:PHASE[snapshot.phase]}</div>}
  <div className="brand-map-tools"><button aria-label={view.mode==='overview'?'Do kurczaka':'Mapa'} onClick={()=>mode(view.mode==='overview'?'move':'overview')}>{view.mode==='overview'?'↩ Do kurczaka':'▦ Mapa'}</button>
   {overview&&<><button aria-label="Przybliż mapę" onClick={()=>onView({...view,overviewCenter:{...view.overviewCenter,zoom:Math.min(4,(view.overviewCenter?.zoom??1)*1.4)}})}>＋</button><button aria-label="Oddal mapę" onClick={()=>onView({...view,overviewCenter:{...view.overviewCenter,zoom:Math.max(1,(view.overviewCenter?.zoom??1)/1.4)}})}>−</button></>}
  </div>
  <div className="brand-enemy-direction">{enemies.length} {enemies.length===1?'kogut':'koguty'} · {enemies[0]&&`${enemies[0].health} HP · `}{enemies[0]?(enemies[0].x>hero.x?'na prawo →':'← na lewo'):''}</div>
  {notice&&!overview&&<p className="brand-notice" role="status">{notice}</p>}
  <div className="brand-bottom">
   {view.mode==='aim'&&active&&<section className="brand-context brand-aim-panel" aria-label="Celowanie">
    <label className="brand-weapon-select">Broń <select aria-label="Broń" value={snapshot.selectedWeaponId} disabled={!active} onChange={e=>onCommand({type:'select',weaponId:e.target.value})}>
     {snapshot.inventory.owned.map(id=><option key={id} value={id}>{WEAPONS[id].name} · {['jajooka','kick'].includes(id)?'bez limitu':snapshot.inventory.ammo[id]??0}</option>)}
    </select></label>
    {ballistic?<><label>Kąt <b>{Math.round(snapshot.aim.angleDeg)}°</b><input aria-label="Kąt" type="range" min="-180" max="180" step="1" value={Math.round(snapshot.aim.angleDeg)} disabled={!active} onChange={e=>onCommand({type:'aim',angleDeg:Number(e.target.value),power:snapshot.aim.power})}/></label>
    <label>Moc <b>{Math.round(snapshot.aim.power/18*100)}%</b><input aria-label="Moc" type="range" min="2" max="18" step=".1" value={snapshot.aim.power} disabled={!active} onChange={e=>onCommand({type:'aim',angleDeg:snapshot.aim.angleDeg,power:Number(e.target.value)})}/></label></>:<button aria-label="Zmień kierunek" onClick={()=>onCommand({type:'aim',angleDeg:snapshot.facing>0?180:0,power:snapshot.aim.power})}>Kierunek {snapshot.facing>0?'→':'←'}</button>}
    <button className="brand-primary" aria-label={action} disabled={!active||ammo===0} onClick={()=>onCommand({type:'attack'})}>{action} ↗</button>
   </section>}
   {view.mode==='tool'&&active&&<section className="brand-context brand-tool-panel" aria-label="Narzędzia">
    <button aria-label="Kilof" aria-pressed={toolId==='pickaxe'} onClick={()=>onTool('pickaxe')}>⛏ Kilof · {snapshot.inventory.tools.pickaxe}</button>
    <button aria-label="Wiertło" aria-pressed={toolId==='drill'} onClick={()=>onTool('drill')}>↓ Wiertło · {snapshot.inventory.tools.drill}</button>
    <button className="brand-primary" aria-label="Użyj narzędzia" disabled={!active||snapshot.toolUsed} onClick={()=>onCommand({type:'tool',toolId,direction:snapshot.facing})}>Użyj narzędzia</button>
   </section>}
   {view.mode==='rope'&&active&&<div className="brand-context"><p>{snapshot.rope?'Lewo / prawo: huśtanie. Zwijaj i puść z rozpędu.':'Dotknij ziemi lub belki, żeby zaczepić lasso.'}</p>
    {!snapshot.rope&&<button aria-label="Szukaj zaczepu" aria-pressed={!!view.ropeOverview} onClick={()=>onView({...view,ropeOverview:!view.ropeOverview})}>{view.ropeOverview?'Bliżej kurczaka':'Szukaj zaczepu'}</button>}
    {snapshot.rope&&<>{hold('reel-in','Zwiń','↑')}{hold('reel-out','Rozwiń','↓')}</>}
   </div>}
   {view.mode==='overview'&&<div className="brand-context"><p>Przesuwaj mapę palcem. Wróć do kurczaka, by wykonać ruch.</p></div>}
   {!overview&&<><nav className="brand-mode-bar" aria-label="Akcje"><button aria-label="Ruch" aria-pressed={view.mode==='move'} onClick={()=>mode('move')}>Ruch</button><button aria-label="Celuj" aria-pressed={view.mode==='aim'} onClick={()=>mode('aim')}>Celuj</button><button aria-label="Narzędzia" aria-pressed={view.mode==='tool'} onClick={()=>mode('tool')}>Narzędzia</button><button aria-label="Zakończ turę" disabled={!active} onClick={()=>onCommand({type:'pass'})}>Koniec tury</button></nav>
   <div className="brand-movement"><div>{hold('left','W lewo','←')}{hold('right','W prawo','→')}</div><div>{hold('jump','Skok','↑')}<button aria-label={snapshot.rope?'Puść lasso':'Lasso'} disabled={!active} onClick={()=>snapshot.rope?onCommand({type:'rope.release'}):mode('rope')}>⌁<small>{snapshot.rope?'Puść':'Lasso'}</small></button></div></div></>}
  </div>
 </div>;
}
