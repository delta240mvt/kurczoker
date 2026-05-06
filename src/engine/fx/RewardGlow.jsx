export function rewardGlowClass(card = {}) {
  const tone = ["red", "blue", "green", "gold"].includes(card.tone) ? card.tone : "gold";
  return `reward-card--${tone}${card.selected ? " reward-card--selected" : ""}`;
}

export function RewardGlow({ tone = "gold", selected = false }) {
  return <span className={`reward-card__glow reward-card__glow--${tone}${selected ? " is-selected" : ""}`} aria-hidden="true" />;
}
