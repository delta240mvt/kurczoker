import assert from "node:assert/strict";
import test from "node:test";

import { getRewardOverlayModel } from "../src/engine/runtime/rewardOverlay.js";
import { SCENES } from "../src/game/constants.js";

test("getRewardOverlayModel exposes reward cards only for reward and shop scenes", () => {
  assert.equal(getRewardOverlayModel({ scene: SCENES.MAP }), null);

  const rewardOverlay = getRewardOverlayModel({
    scene: SCENES.REWARD,
    rewardMode: "reward",
    rewardChoices: [
      { id: "heal-small", type: "heal", label: "Rosol bojowy", value: 2 },
      { id: "shell-shield", type: "artifact", label: "Shell Shield", value: 1 }
    ],
    run: { health: 1, maxHealth: 3, currentNodeId: "battle-1", gold: 4, abilities: ["egg-bomb"] },
    ui: { muted: true, selectedAbilityId: "egg-bomb" }
  });

  assert.equal(rewardOverlay.type, "reward");
  assert.equal(rewardOverlay.cards.length, 2);
  assert.equal(rewardOverlay.cards[0].name, "Rosol bojowy");
  assert.equal(rewardOverlay.cards[0].typeLabel, "Leczenie");
  assert.equal(rewardOverlay.cards[0].valueLabel, "+2 HP");
  assert.ok(rewardOverlay.cards[0].desc);
  assert.ok(rewardOverlay.cards[0].icon);
  assert.equal(rewardOverlay.cards[0].selected, true);
  assert.equal(rewardOverlay.cards[1].selected, false);

  const shopOverlay = getRewardOverlayModel({
    scene: SCENES.SHOP,
    shopOffers: [{ id: "crest-jump", type: "ability", label: "Crest Jump", value: 1, price: 6 }],
    run: { health: 3, maxHealth: 3, currentNodeId: "shop-1", gold: 4, abilities: ["egg-bomb"] },
    ui: { muted: true, selectedAbilityId: "egg-bomb" }
  });

  assert.equal(shopOverlay.type, "shop");
  assert.equal(shopOverlay.cards[0].affordable, false);
  assert.equal(shopOverlay.cards[0].selected, true);
});
