import { Component, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Canvas } from "@react-three/fiber";

import { RewardOverlay } from "./components/RewardOverlay.jsx";
import { GameRuntime } from "./GameRuntime.jsx";
import { selectEngineScene } from "./runtime/sceneSelection.js";
import { bindShellControls, syncShellUiModel } from "./runtime/shellUiSync.js";
import { useGameStore } from "./store/useGameStore.js";
import { createUiModel } from "../game/ui.js";

class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function ShellStatusSync() {
  const game = useGameStore((state) => state.game);

  useEffect(() => {
    syncShellUiModel(document, createUiModel(game));
  }, [game]);

  return null;
}

function ShellControls() {
  useEffect(() => bindShellControls(document, useGameStore), []);

  return null;
}

function TerminalOverlay() {
  const [target, setTarget] = useState(null);
  const game = useGameStore((state) => state.game);
  const reset = useGameStore((state) => state.reset);
  const overlay = createUiModel(game).overlay;

  useEffect(() => {
    setTarget(document.querySelector("[data-game-overlay]"));
  }, []);

  if (!target || overlay?.type !== "end") {
    return null;
  }

  return createPortal(
    <div className={`terminal-overlay terminal-overlay--${overlay.variant}`} role="dialog" aria-label={overlay.title}>
      <div className="reward-overlay__header">
        <span className="reward-overlay__eyebrow">{overlay.eyebrow}</span>
        <h2>{overlay.title}</h2>
      </div>
      <div className="terminal-overlay__stats" role="group" aria-label="Podsumowanie wyprawy">
        {overlay.stats.map((stat) => (
          <div key={stat.key} className="terminal-overlay__stat">
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>
      <div className="reward-cta">
        <button className="btn btn--action" type="button" onClick={reset}>
          {overlay.cta}
        </button>
      </div>
    </div>,
    target
  );
}

function MapRouteActions() {
  const game = useGameStore((state) => state.game);
  const selectNode = useGameStore((state) => state.selectNode);

  if (selectEngineScene(game) !== "map") {
    return null;
  }

  const offeredNodeIds = new Set(game.run?.offeredNodeIds ?? []);
  const offeredNodes = (game.map?.nodes ?? []).filter((node) => offeredNodeIds.has(node.id));

  if (offeredNodes.length === 0) {
    return null;
  }

  return (
    <div className="map-route-actions" aria-label="Dostepne szlaki">
      {offeredNodes.map((node) => (
        <button key={node.id} type="button" className="map-route-actions__btn" onClick={() => selectNode(node.id)}>
          <span className="map-route-actions__type">{node.type}</span>
          <span className="map-route-actions__label">{node.label ?? node.id}</span>
        </button>
      ))}
    </div>
  );
}

function CanvasFallback({ onReset }) {
  return (
    <div className="game-canvas-fallback" role="alert">
      <strong>Scena nie mogla sie uruchomic.</strong>
      <button className="btn btn--restart" type="button" onClick={onReset}>
        Restart
      </button>
    </div>
  );
}

export function KurczokerCanvas() {
  const game = useGameStore((state) => state.game);
  const reset = useGameStore((state) => state.reset);

  return (
    <>
      <CanvasErrorBoundary resetKey={`${game.seed}:${game.scene}`} fallback={<CanvasFallback onReset={reset} />}>
        <Canvas
          aria-label="KURCZOKER game canvas"
          className="kurczoker-r3f"
          dpr={[1, 1.5]}
          orthographic
          role="img"
          camera={{ position: [0, 0, 10], zoom: 72, near: 0.1, far: 100 }}
          gl={{ antialias: false, alpha: true }}
        >
          <GameRuntime />
        </Canvas>
      </CanvasErrorBoundary>
      <MapRouteActions />
      <RewardOverlay />
      <TerminalOverlay />
      <ShellStatusSync />
      <ShellControls />
    </>
  );
}

export default KurczokerCanvas;
