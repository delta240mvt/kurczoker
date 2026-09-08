export const TIPS={move:'Lewo i prawo to spacer. Skok pozwala wejść na stopień. Na komputerze użyj A/D i spacji.',aim:'Wybierz broń, ustaw kąt i moc. Jasne kropki pokazują tor jajka. Strzał kończy Twój ruch.',rope:'Dotknij ziemi lub belki, żeby złapać zaczep. Zwijaj linę, rozhuśtaj się i puść z rozpędu.',tool:'Jedno narzędzie na turę, przed atakiem. Kilof robi przejście przed Tobą, wiertło drąży pod stopami.',overview:'Przesuwaj mapę palcem i użyj przybliżenia. Przycisk „Do kurczaka” przywraca sterowanie.'};
export function HelpPanel({onClose,onTips}){
 return <><span className="brand-kicker">MAŁA ŚCIĄGA</span><h2>Jak zrobić rozróbę?</h2><div className="brand-help-list">
  {Object.entries(TIPS).map(([key,text])=><p key={key}><strong>{{move:'Ruch i skok',aim:'Celowanie',rope:'Lasso',tool:'Narzędzia',overview:'Duża plansza'}[key]}</strong>{text}</p>)}
  <p><strong>Twój ruch może poczekać.</strong>Chodź i używaj lassa bez limitu. Możesz użyć jednego narzędzia, potem wykonać jeden atak. Każdy żywy przeciwnik odpowiada raz.</p>
  <p><strong>Wyprawa</strong>Po wygranej wybierasz nagrodę. Dalej kupujesz zapasy i odzyskujesz zdrowie za ziarenka. Masz jedną drugą szansę od początku przegranej walki.</p>
 </div><button onClick={onTips}>Pokaż wskazówki od początku</button><button className="brand-primary" onClick={onClose}>Wróć do gry</button></>;
}
