/** Pure decision at a turn boundary. Death always wins over phase progression. */
export function nextPhase(state) {
  const player=state.actors.find(a=>a.team==='player');
  const live=state.actors.filter(a=>a.team==='enemy'&&a.health>0);
  const outcome=player.health<=0?'lost':live.length===0?'won':null;
  if(outcome)return {...state,outcome,phase:'finished'};
  if(state.phase==='player-resolve')return {...state,phase:'enemy-tell',enemyQueue:live.map(a=>a.id)};
  if(state.phase==='enemy-resolve') {
    const queue=state.enemyQueue.filter(id=>live.some(a=>a.id===id));
    return {...state,enemyQueue:queue,phase:queue.length?'enemy-tell':'player',
      turn:state.turn+(queue.length?0:1),toolUsed:queue.length?state.toolUsed:false};
  }
  return {...state,outcome:null};
}
