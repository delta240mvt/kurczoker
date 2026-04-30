export function createGameState() {
  return {
    score: 0,
    lastPointText: ""
  };
}

export function collectPoint(state) {
  return {
    ...state,
    score: state.score + 1,
    lastPointText: "KURCZOK!"
  };
}

export function finishGame(state) {
  return {
    title: "Game Over",
    scoreText: `Wynik: ${state.score}`
  };
}

const FLOOR_Y = 214;
const PLAYER = { x: 82, width: 34, height: 44 };
const POINT_TEXT = "KURCZOK!";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function drawRunner(ctx, game) {
  const playerY = FLOOR_Y - PLAYER.height - game.playerOffset;

  ctx.fillStyle = "#202124";
  ctx.fillRect(PLAYER.x, playerY + 8, PLAYER.width, PLAYER.height - 8);
  ctx.fillRect(PLAYER.x + 24, playerY, 18, 16);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(PLAYER.x + 34, playerY + 5, 4, 4);

  const step = Math.floor(game.time / 130) % 2;
  ctx.fillStyle = "#202124";
  ctx.fillRect(PLAYER.x + 6, playerY + PLAYER.height - 2, 8, step ? 16 : 10);
  ctx.fillRect(PLAYER.x + 24, playerY + PLAYER.height - 2, 8, step ? 10 : 16);
}

function drawKurczok(ctx, x, bob) {
  const y = FLOOR_Y - 48 + Math.sin(bob / 120) * 2;

  ctx.fillStyle = "#d97706";
  ctx.fillRect(x + 12, y + 13, 30, 25);
  ctx.fillRect(x + 31, y + 4, 18, 18);
  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(x + 8, y + 17, 18, 14);
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(x + 36, y - 2, 5, 8);
  ctx.fillRect(x + 42, y, 5, 6);
  ctx.fillStyle = "#111827";
  ctx.fillRect(x + 42, y + 9, 3, 3);
  ctx.fillRect(x + 18, y + 38, 5, 12);
  ctx.fillRect(x + 34, y + 38, 5, 12);
  ctx.fillStyle = "#f97316";
  ctx.fillRect(x + 49, y + 11, 10, 5);
}

function drawPoint(ctx, point) {
  ctx.fillStyle = "#1a73e8";
  ctx.fillRect(point.x, point.y, point.size, point.size);
  ctx.fillRect(point.x + 5, point.y - 5, point.size - 10, point.size + 10);
}

function drawScene(ctx, canvas, game) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#dadce0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y);
  ctx.lineTo(canvas.width, FLOOR_Y);
  ctx.stroke();

  ctx.fillStyle = "#5f6368";
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText(`Wynik: ${game.state.score}`, canvas.width - 108, 30);

  if (game.flash > 0) {
    ctx.fillStyle = "#d93025";
    ctx.font = "bold 26px Arial, sans-serif";
    ctx.fillText(POINT_TEXT, 38, 44);
  }

  drawRunner(ctx, game);
  drawPoint(ctx, game.point);
  drawKurczok(ctx, game.chaserX, game.time);
}

function resetPoint(game, canvas) {
  game.point.x = canvas.width + 140 + Math.random() * 180;
  game.point.y = FLOOR_Y - 86 - Math.random() * 58;
}

function setupGame() {
  const canvas = document.querySelector("[data-game-canvas]");
  const overlay = document.querySelector("[data-game-over]");
  const finalScore = document.querySelector("[data-final-score]");
  const ctx = canvas.getContext("2d");

  const game = {
    state: createGameState(),
    running: true,
    time: 0,
    lastFrame: performance.now(),
    velocityY: 0,
    playerOffset: 0,
    chaserX: -64,
    flash: 0,
    speed: 4,
    point: { x: canvas.width + 80, y: FLOOR_Y - 112, size: 18 }
  };

  function showGameOver() {
    game.running = false;
    const result = finishGame(game.state);
    overlay.hidden = false;
    finalScore.textContent = result.scoreText;
    overlay.querySelector("h1").textContent = result.title;
  }

  function restartGame() {
    game.state = createGameState();
    game.running = true;
    game.time = 0;
    game.lastFrame = performance.now();
    game.velocityY = 0;
    game.playerOffset = 0;
    game.chaserX = -64;
    game.flash = 0;
    game.speed = 4;
    game.point = { x: canvas.width + 80, y: FLOOR_Y - 112, size: 18 };
    overlay.hidden = true;
    requestAnimationFrame(loop);
  }

  function jump() {
    if (!game.running) return;

    if (game.playerOffset <= 0) {
      game.velocityY = 13.5;
    }
  }

  function loop(now) {
    if (!game.running) return;

    const delta = clamp(now - game.lastFrame, 0, 34);
    game.lastFrame = now;
    game.time += delta;
    game.speed = 4 + game.state.score * 0.13;
    game.flash = Math.max(0, game.flash - delta);

    game.velocityY -= 0.62;
    game.playerOffset = Math.max(0, game.playerOffset + game.velocityY);
    if (game.playerOffset === 0) game.velocityY = 0;

    game.chaserX = Math.min(PLAYER.x - 52, game.chaserX + 0.012 + game.state.score * 0.0008);
    game.point.x -= game.speed;

    if (game.point.x < -40) resetPoint(game, canvas);

    const playerBox = {
      x: PLAYER.x,
      y: FLOOR_Y - PLAYER.height - game.playerOffset,
      width: PLAYER.width,
      height: PLAYER.height
    };
    const chaserBox = { x: game.chaserX + 10, y: FLOOR_Y - 48, width: 48, height: 48 };
    const pointBox = {
      x: game.point.x,
      y: game.point.y,
      width: game.point.size,
      height: game.point.size
    };

    if (rectsOverlap(playerBox, pointBox)) {
      game.state = collectPoint(game.state);
      game.flash = 720;
      resetPoint(game, canvas);
      game.chaserX -= 18;
    }

    if (rectsOverlap(playerBox, chaserBox)) {
      showGameOver();
      return;
    }

    drawScene(ctx, canvas, game);
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (event) => {
    if (["Space", "ArrowUp", "KeyW"].includes(event.code)) {
      event.preventDefault();
      jump();
    }
  });
  window.addEventListener("pointerdown", jump);

  drawScene(ctx, canvas, game);
  requestAnimationFrame(loop);
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", setupGame);
}
