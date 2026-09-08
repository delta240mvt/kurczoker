const colors={1:'#9672BF',2:'#D9A348',3:'#486361'};
export function MapThumbnail({map}){
 return <svg viewBox={`0 0 ${map.width} ${map.height}`} aria-hidden="true" focusable="false" className={'map-thumbnail theme-'+(map.theme??'meadow')}>
  <g transform={`translate(0 ${map.height}) scale(1 -1)`}>
   {map.shapes.map(s=><rect key={s.id} x={s.x} y={s.y} width={s.width} height={s.height} fill={colors[s.material]??'transparent'}/>)}
   {map.spawns.map(s=><circle key={s.id} cx={s.x} cy={s.y} r={.8} fill={s.team==='player'?'#FFFEFA':'#E24B55'} stroke="#020304" strokeWidth={.2}/>)}
  </g>
 </svg>;
}
export function QuickSelect({maps,selectedMapId,onSelect,onStart}){
 const selected=maps.find(m=>m.id===selectedMapId);
 return <main className="brand-game-menu"><a className="brand-wordmark" href="/">KURCZOKER <small>GRA OD DELTA240MVT</small></a>
  <section className="brand-quick-select"><div className="brand-quick-heading"><span className="brand-kicker">SZYBKA POTYCZKA · WSZYSTKO POD RĘKĄ</span><h1>Wybierz podwórko.<br/><em>Zrób małą rozróbę.</em></h1><p>Dziewięć aren. Sześć broni. Ruch, skoki i lasso bez limitu. Twój ruch może chwilę poczekać.</p></div>
   <div className="brand-map-grid" aria-label="Wybór mapy">{maps.map(map=><button key={map.id} aria-label={map.name} aria-pressed={map.id===selectedMapId} onClick={()=>onSelect(map.id)}><MapThumbnail map={map}/><strong>{map.name}</strong></button>)}</div>
   <div className="brand-quick-start"><div><h2>{selected.name}</h2><p>{selected.summary}</p><small>Każdy start: 100 HP, świeża arena i pełny zapas.</small></div><button className="brand-primary" onClick={onStart}>Rozpocznij potyczkę</button></div>
   <p className="brand-quick-help">Telefon i komputer · Pion i poziom · Bez konta</p>
  </section>
 </main>;
}
