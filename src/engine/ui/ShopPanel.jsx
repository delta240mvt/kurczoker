export function ShopPanel({game,onBuy,onLeave}){
 return <section className="brand-panel"><span className="brand-kicker">PRZYSTANEK W DRODZE · {game.grain} ZIARENEK</span><h1>Mały sklep. Dobry zapas.</h1><p>Zdrowie: {game.health} / {game.maxHealth} HP. Kup to, czego potrzebujesz, albo ruszaj dalej.</p>
  <div className="brand-choice-grid">{game.offers.map(offer=><button key={offer.id} disabled={offer.purchased||game.grain<offer.price} onClick={()=>onBuy(offer.id)}><strong>{offer.label}</strong><span>{offer.description}</span><b>{offer.price} ziarenek</b>{offer.kind==='heal'&&<small>{game.health} → {Math.min(game.maxHealth,game.health+offer.amount)} HP</small>}<small>{offer.purchased?'Już w plecaku':game.grain<offer.price?'Za mało ziarenek':`Po zakupie: ${game.grain-offer.price} ziarenek`}</small></button>)}</div><button className="brand-primary" onClick={onLeave}>Ruszaj dalej</button>
 </section>;
}
