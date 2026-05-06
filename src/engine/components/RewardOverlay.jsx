import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { RewardGlow, rewardGlowClass } from "../fx/RewardGlow.jsx";
import { getRewardOverlayModel } from "../runtime/rewardOverlay.js";
import { useGameStore } from "../store/useGameStore.js";

const ICON_GLYPHS = {
  coin: "G",
  egg: "E",
  heart: "H",
  jump: "J",
  shield: "S"
};

function RewardIcon({ icon, tone }) {
  return (
    <span className={`reward-card__icon reward-card__icon--${tone}`} aria-hidden="true">
      <span>{ICON_GLYPHS[icon] ?? "R"}</span>
    </span>
  );
}

function RewardCard({ card, overlayType, onChoose, onBuy }) {
  const tone = card.tone ?? "gold";
  const className = `reward-card ${rewardGlowClass(card)}${card.affordable === false ? " reward-card--disabled" : ""}`;
  const action = overlayType === "shop" ? () => onBuy(card.id) : () => onChoose(card.id);
  const disabled = overlayType === "shop" && card.affordable === false;

  return (
    <button className={className} type="button" data-reward-id={overlayType === "reward" ? card.id : undefined} data-shop-id={overlayType === "shop" ? card.id : undefined} disabled={disabled} onClick={action}>
      <RewardGlow tone={tone} selected={card.selected} />
      <RewardIcon icon={card.icon} tone={tone} />
      <span className="reward-card__name">{card.name}</span>
      <span className="reward-card__type">{card.typeLabel}</span>
      <span className="reward-card__desc">{card.desc}</span>
      <span className="reward-card__value">{overlayType === "shop" ? `${card.price} ziaren` : card.valueLabel}</span>
    </button>
  );
}

export function RewardOverlay() {
  const [target, setTarget] = useState(null);
  const game = useGameStore((state) => state.game);
  const chooseReward = useGameStore((state) => state.chooseReward);
  const buyShopOffer = useGameStore((state) => state.buyShopOffer);
  const skipShop = useGameStore((state) => state.skipShop);
  const overlay = getRewardOverlayModel(game);

  useEffect(() => {
    setTarget(document.querySelector("[data-game-overlay]"));
  }, []);

  if (!target || !overlay) {
    return null;
  }

  return createPortal(
    <div className={`reward-overlay reward-overlay--${overlay.type}`} role="dialog" aria-label={overlay.title}>
      <div className="reward-overlay__header">
        <span className="reward-overlay__eyebrow">{overlay.type === "shop" ? "Sklep" : "Nagroda"}</span>
        <h2>{overlay.title}</h2>
        <p>{overlay.subtitle}</p>
      </div>
      <div className={`reward-row reward-row--count-${overlay.cards.length}`} role="group" aria-label={overlay.type === "shop" ? "Oferta sklepu" : "Dostepne nagrody"}>
        {overlay.cards.map((card) => (
          <RewardCard key={card.id} card={card} overlayType={overlay.type} onChoose={chooseReward} onBuy={buyShopOffer} />
        ))}
      </div>
      {overlay.cta ? (
        <div className="reward-cta">
          <button className="btn btn--action" type="button" onClick={() => chooseReward(overlay.cards[0]?.id)}>
            {overlay.cta}
          </button>
        </div>
      ) : null}
      {overlay.type === "shop" ? (
        <div className="reward-cta reward-cta--skip">
          <button className="btn btn--restart" type="button" onClick={skipShop}>
            Dalej
          </button>
        </div>
      ) : null}
    </div>,
    target
  );
}
