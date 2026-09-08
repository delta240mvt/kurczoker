import {getMap} from '../tactical/arena.js';
export function ExpeditionMap({game,onSelect,onEnter}){
 return <section className="brand-panel"><span className="brand-kicker">WYPRAWA · {game.completedEncounterIds.length} / 4 STARCIA</span><h1>Mały krok. Nowe podwórze.</h1>
  <p>{game.health} / {game.maxHealth} HP · {game.grain} ziarenek · {game.secondChanceUsed?'Druga szansa wykorzystana':'Druga szansa w zapasie'}</p>
  <ol className="brand-route-progress" aria-label="Postęp wyprawy">{['Podwórze','Rozwidlenie','Za wzgórzem','Jajokról'].map((label,i)=><li key={label} data-complete={game.completedEncounterIds.length>i}>{game.completedEncounterIds.length>i?'✓ ':''}{label}</li>)}</ol>
  <div className="brand-choice-grid">{game.routes.map(route=><button key={route.id} aria-pressed={route.id===game.selectedRouteId} onClick={()=>onSelect(route.id)}><strong>{getMap(route.mapId).name}</strong><span>{route.description}</span><small>{route.stage===3?'Jajokról · 140 HP':route.hard?'Mocniejszy przeciwnik · +15 ziarenek':'Zwykła potyczka'}</small></button>)}</div>
  <button className="brand-primary" onClick={onEnter}>Wejdź na planszę</button><p>Możesz chodzić, skakać i używać lassa bez limitu. Jeden atak oddaje turę przeciwnikowi.</p>
 </section>;
}
