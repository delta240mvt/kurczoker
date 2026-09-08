export function ResultPanel({game,onExpedition,onQuick}){
 const won=game.status==='won';
 return <section className="brand-panel brand-result"><span className="brand-kicker">KURCZOKER · KONIEC WYPRAWY</span><h1>{won?'Korona spadła.':'Tym razem kurnik górą.'}</h1><p>{won?'Cztery starcia, garść ziarenek i porządna rozróba. Możesz wrócić do swoich spraw. Albo jeszcze raz zajrzeć do kurnika.':'Pióra opadną. Następna trasa może potoczyć się inaczej.'}</p><p>{game.completedEncounterIds.length} wygrane walki · {game.grain} ziarenek</p><div className="brand-result-actions"><button className="brand-primary" onClick={onExpedition}>Nowa wyprawa</button><button onClick={onQuick}>Szybka potyczka</button></div><a href="/">Wróć na stronę gry</a></section>;
}
