import { useEffect, useRef } from "react";
import { ABILITY_COPY } from "./copy.js";
export function Controls({
  sim,
  snapshot,
  abilities,
  selected,
  onSelect,
  fire,
  paused,
  onPause,
}) {
  const callbacks = useRef({ fire, onPause, paused });
  callbacks.current = { fire, onPause, paused };
  useEffect(() => {
    const keys = new Set();
    function move() {
      sim.move(
        (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
          (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0),
      );
    }
    function down(e) {
      if (e.code === "Escape") {
        e.preventDefault();
        if (!e.repeat) callbacks.current.onPause();
        return;
      }
      if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      if (
        ![
          "KeyA",
          "KeyD",
          "ArrowLeft",
          "ArrowRight",
          "KeyW",
          "ArrowUp",
          "Space",
          "Enter",
        ].includes(e.code)
      )
        return;
      e.preventDefault();
      if (callbacks.current.paused) return;
      keys.add(e.code);
      move();
      if (["KeyW", "ArrowUp"].includes(e.code) && !e.repeat) sim.jump();
      if (["Space", "Enter"].includes(e.code) && !e.repeat)
        callbacks.current.fire();
    }
    function up(e) {
      keys.delete(e.code);
      move();
    }
    function clear() {
      keys.clear();
      sim.move(0);
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      clear();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, [sim]);
  const active = snapshot?.phase === "player" && !snapshot.paused && !paused;
  const moveButton = (direction, label) => (
    <button
      className="move-button"
      aria-label={label}
      disabled={!active}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        sim.move(direction);
      }}
      onPointerUp={() => sim.move(0)}
      onPointerCancel={() => sim.move(0)}
      onLostPointerCapture={() => sim.move(0)}
    >
      {direction < 0 ? "←" : "→"}
    </button>
  );
  return (
    <section className="battle-controls" aria-label="Sterowanie walką">
      <div className="ability-bar">
        {abilities.map((id) => (
          <button
            key={id}
            aria-label={ABILITY_COPY[id].name}
            aria-pressed={id === selected}
            disabled={!active}
            className={`ability-button ${id === selected ? "selected" : ""}`}
            onClick={() => onSelect(id)}
          >
            <span>{ABILITY_COPY[id].icon}</span>
            <small>{ABILITY_COPY[id].name}</small>
          </button>
        ))}
      </div>
      <div className="aim-controls">
        <button
          className="direction-button"
          aria-label="Zmień kierunek rzutu"
          disabled={!active}
          onClick={() => sim.aim(sim.angle, sim.power, -sim.facing)}
        >
          {snapshot?.facing === -1 ? "←" : "→"}
        </button>
        <label>
          Kąt <strong>{Math.round(snapshot?.angle ?? 40)}°</strong>
          <input
            aria-label="Kąt rzutu"
            type="range"
            min="10"
            max="80"
            step="1"
            disabled={!active}
            onChange={(e) => sim.aim(Number(e.target.value))}
            value={Math.round(snapshot?.angle ?? 40)}
          />
        </label>
        <label>
          Moc{" "}
          <strong>
            {Math.round((((snapshot?.power ?? 9) - 6) / 8) * 100)}%
          </strong>
          <input
            aria-label="Moc rzutu"
            type="range"
            min="6"
            max="14"
            step="0.1"
            disabled={!active}
            onChange={(e) => sim.aim(sim.angle, Number(e.target.value))}
            value={snapshot?.power ?? 9}
          />
        </label>
      </div>
      <div className="movement-controls">
        {moveButton(-1, "Ruch w lewo")}
        {moveButton(1, "Ruch w prawo")}
        <button
          className="move-button"
          aria-label="Skok"
          disabled={!active}
          onClick={() => sim.jump()}
        >
          ↑
        </button>
        <span className="key-hint">A / D · W</span>
      </div>
      <button
        className="primary fire-button"
        disabled={!active}
        onClick={fire}
        aria-label={ABILITY_COPY[selected]?.action ?? "Rzuć jajobombę"}
      >
        <span>{ABILITY_COPY[selected]?.icon}</span>
        {ABILITY_COPY[selected]?.action}
        <small>SPACJA / ENTER</small>
      </button>
    </section>
  );
}
