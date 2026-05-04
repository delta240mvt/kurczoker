import { CANVAS, SCENES } from "./constants.js";
import { getAbilityById } from "./abilities.js";

const SAMPLE_NODES = [
  { id: "start", type: "start", label: "Start", depth: 0, nextNodeIds: ["battle-1"], payload: {} },
  { id: "battle-1", type: "battle", label: "Zasadzka", depth: 1, nextNodeIds: ["treasure-1"], payload: {} },
  { id: "treasure-1", type: "treasure", label: "Skarb", depth: 2, nextNodeIds: ["boss"], payload: {} },
  { id: "boss", type: "boss", label: "Krol Kur", depth: 3, nextNodeIds: [], payload: {} }
];

const SAMPLE_BATTLE = {
  actors: [
    {
      id: "player",
      kind: "player",
      team: "player",
      x: 170,
      y: CANVAS.GROUND_Y - 58,
      width: 42,
      height: 58,
      health: 3,
      maxHealth: 3
    },
    {
      id: "enemy-1",
      kind: "enemy",
      team: "enemy",
      x: 700,
      y: CANVAS.GROUND_Y - 48,
      width: 46,
      height: 48,
      health: 2,
      maxHealth: 2
    }
  ],
  platforms: [
    { id: "ledge-left", x: 92, y: 330, width: 190, height: 20 },
    { id: "ledge-right", x: 620, y: 300, width: 180, height: 20 }
  ],
  hazards: [{ id: "spikes", type: "spikes", x: 435, y: CANVAS.GROUND_Y - 18, width: 112, height: 18, damage: 1 }],
  projectiles: [],
  phase: "player-turn",
  turnRemainingMs: 8000
};

function getCanvas(ctx) {
  return ctx.canvas ?? { width: CANVAS.WIDTH, height: CANVAS.HEIGHT };
}

function fillBackground(ctx, top = "#f8fafc", ground = "#d9f99d") {
  const canvas = getCanvas(ctx);
  const width = canvas.width || CANVAS.WIDTH;
  const height = canvas.height || CANVAS.HEIGHT;

  ctx.fillStyle = top;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#dbeafe";
  ctx.fillRect(0, Math.round(height * 0.62), width, Math.round(height * 0.38));
  ctx.fillStyle = ground;
  ctx.fillRect(0, CANVAS.GROUND_Y, width, height - CANVAS.GROUND_Y);
  ctx.strokeStyle = "#166534";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, CANVAS.GROUND_Y);
  ctx.lineTo(width, CANVAS.GROUND_Y);
  ctx.stroke();
}

function writeText(ctx, text, x, y, options = {}) {
  ctx.fillStyle = options.color ?? "#172554";
  ctx.font = options.font ?? "18px Arial, sans-serif";
  ctx.textAlign = options.align ?? "left";
  ctx.textBaseline = options.baseline ?? "alphabetic";
  ctx.fillText(text, x, y);
}

function drawPanel(ctx, x, y, width, height, fill = "rgba(255,255,255,0.88)") {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "#1f2937";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
}

function nodeColor(type) {
  if (type === "boss") return "#dc2626";
  if (type === "treasure" || type === "shop") return "#eab308";
  if (type === "elite") return "#7c3aed";
  if (type === "start") return "#16a34a";
  return "#2563eb";
}

function drawActor(ctx, actor) {
  const x = actor.x ?? 0;
  const y = actor.y ?? 0;
  const width = actor.width ?? 38;
  const height = actor.height ?? 48;
  const isPlayer = actor.team === "player" || actor.kind === "player";

  ctx.fillStyle = isPlayer ? "#facc15" : "#ef4444";
  ctx.fillRect(x, y + height * 0.22, width, height * 0.7);
  ctx.fillStyle = isPlayer ? "#f97316" : "#991b1b";
  ctx.fillRect(x + width * 0.55, y, width * 0.42, height * 0.38);
  ctx.fillStyle = "#111827";
  ctx.fillRect(x + width * 0.77, y + height * 0.16, 4, 4);
  ctx.fillRect(x + width * 0.2, y + height * 0.92, 5, 12);
  ctx.fillRect(x + width * 0.62, y + height * 0.92, 5, 12);
  ctx.fillStyle = isPlayer ? "#ef4444" : "#7f1d1d";
  ctx.fillRect(x + width * 0.58, y - 8, 7, 10);
  ctx.fillRect(x + width * 0.76, y - 5, 7, 8);

  const maxHealth = actor.maxHealth || actor.health || 1;
  const healthRatio = Math.max(0, Math.min(1, (actor.health ?? maxHealth) / maxHealth));
  ctx.fillStyle = "#111827";
  ctx.fillRect(x, y - 18, width, 6);
  ctx.fillStyle = isPlayer ? "#22c55e" : "#f97316";
  ctx.fillRect(x, y - 18, width * healthRatio, 6);
}

export function drawGame(ctx, canvas = getCanvas(ctx), state = {}) {
  if (!ctx) return;
  if (canvas && !ctx.canvas) ctx.canvas = canvas;

  const scene = state.scene ?? SCENES.MAP;
  if (scene === SCENES.BATTLE) drawBattle(ctx, state);
  else if (scene === SCENES.REWARD) drawReward(ctx, state);
  else if (scene === SCENES.GAME_OVER) drawEndScene(ctx, state, "Game Over", "#fee2e2");
  else if (scene === SCENES.RUN_COMPLETE) drawEndScene(ctx, state, "Run Complete", "#dcfce7");
  else drawMap(ctx, state);

  drawHud(ctx, state);
}

export function drawMap(ctx, state = {}) {
  fillBackground(ctx, "#eef6ff", "#bbf7d0");
  const canvas = getCanvas(ctx);
  const nodes = state.map?.nodes?.length ? state.map.nodes : SAMPLE_NODES;
  const currentNodeId = state.run?.currentNodeId ?? "start";
  const offered = new Set(state.run?.offeredNodeIds ?? []);
  const completed = new Set(state.run?.completedNodeIds ?? []);

  writeText(ctx, "KURCZOKER: mapa wyprawy", 32, 48, { font: "bold 28px Arial, sans-serif" });

  const columns = Math.max(1, Math.max(...nodes.map((node) => node.depth ?? 0)) + 1);
  const rowsByDepth = new Map();
  nodes.forEach((node) => {
    const depth = node.depth ?? 0;
    rowsByDepth.set(depth, [...(rowsByDepth.get(depth) ?? []), node]);
  });

  const positions = new Map();
  nodes.forEach((node) => {
    const depth = node.depth ?? 0;
    const row = rowsByDepth.get(depth) ?? [node];
    const index = row.findIndex((entry) => entry.id === node.id);
    const x = 104 + depth * ((canvas.width - 208) / Math.max(1, columns - 1));
    const y = 142 + index * 92 + (3 - row.length) * 24;
    positions.set(node.id, { x, y });
  });

  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 3;
  nodes.forEach((node) => {
    const from = positions.get(node.id);
    (node.nextNodeIds ?? []).forEach((id) => {
      const to = positions.get(id);
      if (!from || !to) return;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    });
  });

  nodes.forEach((node) => {
    const position = positions.get(node.id);
    if (!position) return;
    const active = node.id === currentNodeId;
    const available = offered.has(node.id);
    ctx.fillStyle = completed.has(node.id) ? "#86efac" : nodeColor(node.type);
    ctx.beginPath();
    ctx.arc(position.x, position.y, active ? 28 : 23, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = available || active ? "#111827" : "#ffffff";
    ctx.lineWidth = available || active ? 4 : 2;
    ctx.stroke();
    writeText(ctx, node.label ?? node.id, position.x, position.y + 46, {
      align: "center",
      font: "14px Arial, sans-serif",
      color: "#111827"
    });
  });
}

export function drawBattle(ctx, state = {}) {
  fillBackground(ctx, "#eff6ff", "#84cc16");
  const battle = state.battle ?? SAMPLE_BATTLE;

  for (const platform of battle.platforms ?? []) {
    ctx.fillStyle = "#92400e";
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    ctx.fillStyle = "#a3e635";
    ctx.fillRect(platform.x, platform.y, platform.width, 5);
  }

  for (const hazard of battle.hazards ?? []) {
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
    ctx.strokeStyle = "#7f1d1d";
    ctx.beginPath();
    for (let x = hazard.x; x <= hazard.x + hazard.width; x += 16) {
      ctx.moveTo(x, hazard.y + hazard.height);
      ctx.lineTo(x + 8, hazard.y);
      ctx.lineTo(x + 16, hazard.y + hazard.height);
    }
    ctx.stroke();
  }

  for (const actor of battle.actors ?? SAMPLE_BATTLE.actors) drawActor(ctx, actor);

  for (const projectile of battle.projectiles ?? []) {
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius ?? 8, 0, Math.PI * 2);
    ctx.fill();
  }

  const seconds = Math.max(0, Math.ceil((battle.turnRemainingMs ?? 0) / 1000));
  writeText(ctx, `Tura: ${battle.phase ?? "player-turn"}  ${seconds}s`, 32, 48, {
    font: "bold 24px Arial, sans-serif"
  });
}

export function drawReward(ctx, state = {}) {
  fillBackground(ctx, "#fffbeb", "#fde68a");
  const choices = state.rewardChoices?.length
    ? state.rewardChoices
    : [
        { id: "guard-chick", type: "ability", label: "Pisklak Straznik", value: 1 },
        { id: "gold", type: "gold", label: "Ziarno zlota", value: 15 },
        { id: "heal", type: "heal", label: "Rosol odwagi", value: 1 }
      ];

  writeText(ctx, "Wybierz nagrode", 32, 52, { font: "bold 30px Arial, sans-serif" });
  choices.slice(0, 3).forEach((reward, index) => {
    const x = 70 + index * 285;
    drawPanel(ctx, x, 145, 230, 210, "#fff7ed");
    writeText(ctx, reward.label ?? reward.id, x + 20, 205, { font: "bold 19px Arial, sans-serif" });
    writeText(ctx, reward.type ?? "reward", x + 20, 245, { color: "#475569" });
    writeText(ctx, `+${reward.value ?? 1}`, x + 20, 292, { font: "bold 34px Arial, sans-serif", color: "#b45309" });
  });
}

export function drawHud(ctx, state = {}) {
  const canvas = getCanvas(ctx);
  const run = state.run ?? {};
  const ui = state.ui ?? {};
  const ability = getAbilityById(ui.selectedAbilityId ?? run.abilities?.[0] ?? "egg-bomb");

  drawPanel(ctx, 18, canvas.height - 78, canvas.width - 36, 54, "rgba(248,250,252,0.92)");
  writeText(ctx, `HP ${run.health ?? 3}/${run.maxHealth ?? 3}`, 38, canvas.height - 44, {
    font: "bold 18px Arial, sans-serif"
  });
  writeText(ctx, `Wezel: ${run.currentNodeId ?? "start"}`, 170, canvas.height - 44, {
    color: "#334155"
  });
  writeText(ctx, `Akcja: ${ability.label ?? ability.id}`, 350, canvas.height - 44, { color: "#334155" });
  writeText(ctx, ui.muted ? "Audio: mute" : "Audio: on", canvas.width - 152, canvas.height - 44, {
    color: ui.muted ? "#64748b" : "#166534"
  });
  if (ui.message) writeText(ctx, ui.message, 38, canvas.height - 18, { font: "13px Arial, sans-serif", color: "#475569" });
}

function drawEndScene(ctx, state, label, background) {
  fillBackground(ctx, background, "#fef3c7");
  const canvas = getCanvas(ctx);
  drawPanel(ctx, canvas.width / 2 - 180, 150, 360, 180, "rgba(255,255,255,0.92)");
  writeText(ctx, label, canvas.width / 2, 225, {
    align: "center",
    font: "bold 34px Arial, sans-serif",
    color: "#111827"
  });
  writeText(ctx, state.ui?.message ?? "Restartuj wyprawe.", canvas.width / 2, 270, {
    align: "center",
    color: "#475569"
  });
}
