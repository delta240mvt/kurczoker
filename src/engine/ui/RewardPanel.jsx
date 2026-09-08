export function RewardPanel({game,onChoose}){
 return <section className="brand-panel"><span className="brand-kicker">DOBRA ROBOTA · {game.grain} ZIARENEK</span><h1>Coś do plecaka.</h1>
  <p>{game.stage===0?'Granajko i trzy granaty są Twoje. Wybierz jeszcze narzędzie.':'Wybierz jedną korzyść na dalszą drogę.'}</p><p>Zdrowie: {game.health} / {game.maxHealth} HP</p>
  <div className="brand-choice-grid">{game.rewardChoices.map(reward=><button key={reward.id} onClick={()=>onChoose(reward.id)}><strong>{reward.label}</strong><span>{reward.description}</span>{reward.kind==='heal'&&<small>{game.health} → {Math.min(game.maxHealth,game.health+reward.amount)} HP</small>}</button>)}</div>
 </section>;
}
