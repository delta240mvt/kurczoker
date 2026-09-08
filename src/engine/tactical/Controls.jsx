import { useEffect, useRef, useMemo } from "react";
import {createInputRouter,bindInput} from './input.js';
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
  const router=useMemo(()=>createInputRouter(command=>sim.dispatch(command)),[sim]);
  useEffect(()=>bindInput({router,onPause:()=>callbacks.current.onPause(),onRope:()=>{
    if(sim.rope.attached)sim.dispatch({type:'rope.release'});
    else router.setMode('rope');
  }}),[sim,router]);
  useEffect(()=>router.setMode(paused||snapshot?.phase!=='player'?'menu':'move'),[paused,snapshot?.phase,router]);
  const active = snapshot?.phase === "player" && !snapshot.paused && !paused;
  const moveButton = (direction, label) => (
    <button
      className="move-button"
      aria-label={label}
      disabled={!active}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        router.press('pointer:'+e.pointerId,direction<0?'left':'right');
      }}
      onPointerUp={e => router.release('pointer:'+e.pointerId)}
      onPointerCancel={() => router.clear()}
      onLostPointerCapture={e => router.release('pointer:'+e.pointerId)}
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
          onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);router.press('pointer:'+e.pointerId,'jump');}}
          onPointerUp={e=>router.release('pointer:'+e.pointerId)}
          onPointerCancel={()=>router.clear()}
          onLostPointerCapture={e=>router.release('pointer:'+e.pointerId)}
        >
          ↑
        </button>
        <span className="key-hint">A / D · SPACJA</span>
      </div>
      <button
        className="primary fire-button"
        disabled={!active}
        onClick={fire}
        aria-label={ABILITY_COPY[selected]?.action ?? "Rzuć jajobombę"}
      >
        <span>{ABILITY_COPY[selected]?.icon}</span>
        {ABILITY_COPY[selected]?.action}
        <small>ATAK KOŃCZY TURĘ</small>
      </button>
    </section>
  );
}
