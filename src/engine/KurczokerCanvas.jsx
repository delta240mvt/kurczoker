import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { GameRuntime } from "./GameRuntime.jsx";
import { useGameStore } from "./store/useGameStore.js";
import { Controls } from "./tactical/Controls.jsx";
import { ABILITY_COPY, REWARD_COPY, ROUTE_COPY } from "./tactical/copy.js";
import {
  SAVE_KEY,
  encodeCheckpoint,
  decodeCheckpoint,
} from "./tactical/checkpoint.js";
import { pointToAim } from "./tactical/ballistics.js";
import { createAudioController, setMuted, playEffect } from "../game/audio.js";

class SceneBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch() {
    this.props.onError?.();
  }
  render() {
    return this.state.error ? (
      <div className="scene-error" role="alert">
        <h2>Scena potrzebuje restartu</h2>
        <p>Sprawdź obsługę WebGL2 i spróbuj ponownie.</p>
        <button className="primary" onClick={this.props.onRetry}>
          Spróbuj ponownie
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function PerformanceReadout({ publish }) {
  const { gl } = useThree();
  const times = useRef([]),
    last = useRef(0);
  useFrame((_, dt) => {
    times.current.push(dt * 1000);
    last.current += dt;
    if (last.current >= 2) {
      const sorted = times.current.slice().sort((a, b) => a - b);
      publish({
        fps: Math.round(times.current.length / last.current),
        p95: Math.round(sorted[Math.floor(sorted.length * 0.95)]),
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
      });
      times.current.length = 0;
      last.current = 0;
    }
  });
  return null;
}
const PHASE_COPY = {
  player: "Twoja tura",
  "player-shot": "Jajobomba w locie",
  "enemy-tell": "Uwaga — przeciwnik celuje",
  "enemy-shot": "Atak przeciwnika",
  settle: "Za chwilę Twój ruch",
  finished: "Starcie rozstrzygnięte",
};

export function KurczokerCanvas() {
  const game = useGameStore((s) => s.game),
    actions = useGameStore.getState();
  const [started, setStarted] = useState(false),
    [saved, setSaved] = useState(null),
    [booted, setBooted] = useState(false);
  const [paused, setPaused] = useState(false),
    [help, setHelp] = useState(false),
    [quality, setQuality] = useState("auto");
  const [sim, setSim] = useState(null),
    [snapshot, setSnapshot] = useState(null),
    [loading, setLoading] = useState(false);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [retry, setRetry] = useState(0),
    [stats, setStats] = useState(null);
  const [mobile, setMobile] = useState(false),
    [muted, setAudioMuted] = useState(true);
  const simRef = useRef(null),
    pausedRef = useRef(false),
    audio = useRef(null),
    resultTimer = useRef(null),
    perfSamples = useRef(0);
  const effectiveQuality =
    quality === "auto" ? (mobile ? "low" : "high") : quality;
  const encounter =
    started && game.scene === "battle" ? game.battle?.encounterId : null;
  const gameRef = useRef(game);
  gameRef.current = game;
  pausedRef.current = paused;

  useEffect(() => {
    setMobile(
      window.matchMedia("(max-width: 700px)").matches ||
        navigator.hardwareConcurrency <= 4,
    );
    try {
      setSaved(decodeCheckpoint(localStorage.getItem(SAVE_KEY)));
      const pref = JSON.parse(
        localStorage.getItem("kurczoker.settings") ?? "{}",
      );
      if (["auto", "low", "high"].includes(pref.quality))
        setQuality(pref.quality);
    } catch {
      /* Browsers with blocked storage can still play. */
    }
    setBooted(true);
    return () => {
      clearTimeout(resultTimer.current);
      audio.current?.context?.close?.();
    };
  }, []);
  useEffect(() => {
    if (!started || !booted) return;
    try {
      const encoded = encodeCheckpoint(game);
      if (encoded) localStorage.setItem(SAVE_KEY, encoded);
      else if (["game-over", "run-complete"].includes(game.scene))
        localStorage.removeItem(SAVE_KEY);
    } catch {
      setNotice(
        "Zapis lokalny jest niedostępny. Możesz grać dalej w tej karcie.",
      );
    }
  }, [game, started, booted]);
  useEffect(() => {
    if (booted) {
      try {
        localStorage.setItem("kurczoker.settings", JSON.stringify({ quality }));
      } catch {}
    }
  }, [quality, booted]);
  useEffect(() => {
    let cancelled = false,
      owned;
    setSim(null);
    setSnapshot(null);
    setError("");
    simRef.current = null;
    if (!encounter) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const current = gameRef.current;
    import("./tactical/simulation.js")
      .then((m) =>
        m.createBattleSimulation({
          ...current.run,
          type: current.battle.type,
          encounterId: encounter,
        }),
      )
      .then((runtime) => {
        if (cancelled) {
          runtime.dispose();
          return;
        }
        owned = runtime;
        runtime.setPaused(true);
        simRef.current = runtime;
        setSim(runtime);
        setSnapshot(runtime.snapshot());
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Nie udało się załadować areny. Sprawdź połączenie i spróbuj ponownie.",
          );
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      clearTimeout(resultTimer.current);
      if (simRef.current === owned) simRef.current = null;
      owned?.dispose();
    };
  }, [encounter, retry]);
  const pause = useCallback((value) => {
    pausedRef.current = value;
    simRef.current?.setPaused(value);
    setPaused(value);
  }, []);
  useEffect(() => {
    const blur = () => {
      if (simRef.current && !simRef.current.outcome) pause(true);
    };
    const hidden = () => {
      if (document.hidden) blur();
    };
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [pause]);
  function toggleAudio() {
    audio.current ??= createAudioController();
    setMuted(audio.current, !muted);
    setAudioMuted(!muted);
    if (muted) playEffect(audio.current, "treasure");
  }
  const onEvent = useCallback((event) => {
    const effect = {
      shoot: "shoot",
      impact: "hit",
      won: "victory",
      lost: "defeat",
      ability: "treasure",
    }[event.type];
    if (effect && audio.current) playEffect(audio.current, effect);
    if (event.type === "impact")
      setNotice(
        event.damage
          ? `${event.team === "player" ? "Trafienie" : "Przeciwnik trafia"}! −${event.damage} HP`
          : "Pudło lub zablokowany atak.",
      );
  }, []);
  const onReady = useCallback(() => {
    setLoading(false);
    simRef.current?.setPaused(pausedRef.current);
  }, []);
  const onPerformance = useCallback((sample) => {
    setStats(sample);
    perfSamples.current++;
    if (perfSamples.current >= 3 && sample.fps < 26) setMobile(true);
  }, []);
  const onOutcome = useCallback((state) => {
    const current = simRef.current;
    resultTimer.current = setTimeout(() => {
      if (simRef.current !== current || current?.disposed) return;
      useGameStore
        .getState()
        .finishEncounter({
          encounterId: current.options.encounterId,
          won: state.outcome === "won",
          health: state.player.health,
        });
    }, 850);
  }, []);
  const onAim = useCallback((point) => {
    const s = simRef.current;
    if (s && !s.disposed)
      s.aim(
        pointToAim(s.origin(), point),
        s.power,
        point.x >= s.player.body.translation().x ? 1 : -1,
      );
  }, []);
  const selectNode = useCallback((id) => {
    setNotice("");
    useGameStore.getState().selectNode(id);
  }, []);
  function newRun() {
    clearTimeout(resultTimer.current);
    pause(false);
    actions.reset();
    setSaved(null);
    setStarted(true);
    setNotice("");
  }
  function fire() {
    if (!loading && simRef.current?.fire(gameRef.current.ui.selectedAbilityId))
      setSnapshot(simRef.current.snapshot());
  }
  const routes = game.map.nodes.filter((n) =>
    game.run.offeredNodeIds.includes(n.id),
  );
  const selectedAbility = game.ui.selectedAbilityId;
  const battle = !!encounter;
  const overlay =
    started &&
    ["reward", "shop", "game-over", "run-complete"].includes(game.scene);
  const playerHealth = snapshot?.player.health ?? game.run.health;
  return (
    <div
      className="kurczoker-app"
      data-scene={started ? game.scene : "menu"}
      data-battle-phase={snapshot?.phase ?? ""}
      data-sim-time={snapshot?.time}
      data-player-x={snapshot?.player.x}
      data-projectile-team={snapshot?.projectile?.team ?? ""}
    >
      <header className="game-header">
        <a
          className="game-logo"
          href="/"
          aria-label="KURCZOKER — strona główna"
        >
          <span>♜</span>KURCZOKER<small>KRONIKI KURNIKA</small>
        </a>
        <div className="game-tools">
          <button
            onClick={toggleAudio}
            aria-label={muted ? "Włącz dźwięk" : "Wyłącz dźwięk"}
          >
            {muted ? "♪ Dźwięk" : "♫ Dźwięk"}
          </button>
          <button
            onClick={() => {
              setHelp(true);
              if (battle) pause(true);
            }}
            aria-label="Jak grać"
          >
            ? <span>Jak grać</span>
          </button>
          {started && (
            <button onClick={() => pause(true)} aria-label="Pauza">
              Ⅱ <span>Pauza</span>
            </button>
          )}
        </div>
      </header>
      <div className="expedition-heading">
        <div>
          <span className="eyebrow">
            {!started
              ? "MAŁY BOHATER. WIELKA WYPRAWA."
              : battle
                ? `STARCIE ${game.run.completedNodeIds.length + 1}`
                : "TWOJA WYPRAWA"}
          </span>
          <h1>
            {!started
              ? "Niech polecą pióra."
              : battle
                ? (sim?.arena.name ?? "Wkraczasz na arenę…")
                : game.scene === "map"
                  ? "Wybierz swój szlak"
                  : game.scene === "shop"
                    ? "Przystanek u nioski"
                    : "Kronika wyprawy"}
          </h1>
        </div>
        {started && (
          <div className="run-stats">
            <span className="hp">
              ♥ <b data-player-hp>{playerHealth}</b> / {game.run.maxHealth}
            </span>
            <span>
              ✧ <b>{game.run.gold}</b> ziaren
            </span>
            <span className="route-count">
              ⚑ {game.run.completedNodeIds.length} miejsc
            </span>
          </div>
        )}
      </div>
      <main
        className={`play-stage ${!started ? "play-stage--menu" : ""}`}
        aria-label="Arena KURCZOKER"
      >
        <SceneBoundary
          key={retry}
          onError={() => {
            setLoading(false);
            simRef.current?.setPaused(true);
            if (simRef.current && !simRef.current.disposed)
              setSnapshot(simRef.current.snapshot());
          }}
          onRetry={() => window.location.reload()}
        >
          <Canvas
            className="tactical-canvas"
            orthographic
            camera={{ position: [0, 6, 16], zoom: 50, near: 0.1, far: 150 }}
            dpr={effectiveQuality === "low" ? 1 : [1, 1.5]}
            shadows={effectiveQuality !== "low"}
            gl={{
              antialias: effectiveQuality !== "low",
              alpha: false,
              powerPreference: "high-performance",
            }}
            fallback={
              <div className="scene-error" role="alert">
                Ta przeglądarka nie udostępnia WebGL2. Włącz akcelerację grafiki
                lub użyj aktualnej przeglądarki.
              </div>
            }
          >
            <Suspense fallback={null}>
              <GameRuntime
                key={sim?.options.encounterId ?? "map"}
                sim={sim}
                game={game}
                quality={effectiveQuality}
                selectNode={selectNode}
                menu={!started}
                onSnapshot={setSnapshot}
                onEvent={onEvent}
                onOutcome={onOutcome}
                onReady={onReady}
                onAim={onAim}
              />
            </Suspense>
            <PerformanceReadout publish={onPerformance} />
          </Canvas>
        </SceneBoundary>
        <div className="stage-vignette" />
        {!started && (
          <section className="start-card">
            <span className="chapter-tag">ROZDZIAŁ I · ZŁOTE GRZĘDY</span>
            <h2>
              Pióra ze stali.
              <br />
              <em>Serce wojownika.</em>
            </h2>
            <p>
              Wybierz szlak. Wymierz jajobombę.
              <br />
              Strąć Jajokróla z jego grzędy.
            </p>
            <div className="start-actions">
              {saved && (
                <button
                  className="primary"
                  onClick={() => {
                    actions.restore(saved);
                    setStarted(true);
                  }}
                >
                  Kontynuuj wyprawę
                </button>
              )}
              <button
                className={saved ? "secondary" : "primary"}
                aria-label="Nowa wyprawa"
                disabled={!booted}
                onClick={newRun}
              >
                Nowa wyprawa <span>→</span>
              </button>
            </div>
            <small>Bez konta · Pełne 3D · Twój ruch ma znaczenie</small>
          </section>
        )}
        {battle && snapshot && !loading && (
          <div
            className={`battle-banner ${snapshot.phase.startsWith("enemy") ? "enemy" : ""}`}
            role="status"
          >
            <small>TURA {snapshot.turn}</small>
            <strong>{PHASE_COPY[snapshot.phase]}</strong>
            {snapshot.phase === "player" && (
              <span className="turn-clock">
                {Math.ceil(snapshot.remaining)}s
              </span>
            )}
          </div>
        )}
        {battle && snapshot && (
          <>
            <div className="actor-card actor-card--player">
              <span>KURCZOKER {snapshot.guard ? "⬡" : ""}</span>
              <b>
                {snapshot.player.health} / {snapshot.player.maxHealth} ♥
              </b>
            </div>
            <div className="actor-card actor-card--enemy">
              <span>
                {game.battle.type === "boss"
                  ? "JAJOKRÓL"
                  : game.battle.type === "elite"
                    ? "STRAŻNIK GRZĘDY"
                    : "ZADZIORNY KOGUT"}
              </span>
              <b>
                {snapshot.enemy.health} / {snapshot.enemy.maxHealth} ♥
              </b>
            </div>
          </>
        )}
        {loading && (
          <div className="stage-loading" role="status">
            <span className="loading-egg">◉</span>
            <strong>Przygotowujemy arenę</strong>
            <span>Ostrzymy dzioby i liczymy jajobomby…</span>
          </div>
        )}
        {error && (
          <div className="stage-loading" role="alert">
            <p>{error}</p>
            <button className="primary" onClick={() => setRetry((n) => n + 1)}>
              Spróbuj ponownie
            </button>
          </div>
        )}
        {overlay && (
          <div className="campaign-overlay">
            {["reward", "shop"].includes(game.scene) ? (
              <section className="loot-panel">
                <span className="eyebrow">
                  {game.scene === "shop"
                    ? "DOBRY SPRZĘT TO POŁOWA ZWYCIĘSTWA"
                    : "JEDNO STARCIE BLIŻEJ CHWAŁY"}
                </span>
                <h2>
                  {game.scene === "shop"
                    ? "Coś na dalszą drogę?"
                    : "Łup należy do Ciebie"}
                </h2>
                <p>
                  {game.scene === "shop"
                    ? `Masz ${game.run.gold} ziaren. Wybierz zakup lub ruszaj dalej.`
                    : "Wybierz jedno wzmocnienie. Zostanie z Tobą do końca wyprawy."}
                </p>
                <div className="loot-grid">
                  {(game.scene === "shop"
                    ? game.shopOffers
                    : game.rewardChoices
                  ).map((reward, i) => {
                    const copy = REWARD_COPY[reward.id] ?? {
                      name: reward.label,
                      icon: "✦",
                      description: "Wzmocnienie wyprawy.",
                    };
                    return (
                      <button
                        className="loot-card"
                        key={`${reward.id}-${i}`}
                        data-reward-id={
                          game.scene === "reward" ? reward.id : undefined
                        }
                        data-shop-id={
                          game.scene === "shop" ? reward.id : undefined
                        }
                        disabled={
                          game.scene === "shop" && game.run.gold < reward.price
                        }
                        onClick={() => {
                          if (game.scene === "shop")
                            actions.buyShopOffer(reward.id);
                          else actions.chooseReward(reward.id);
                          if (audio.current)
                            playEffect(audio.current, "treasure");
                        }}
                      >
                        <span className="loot-icon">{copy.icon}</span>
                        <small>
                          {reward.type === "ability"
                            ? "ZDOLNOŚĆ"
                            : reward.type === "artifact"
                              ? "ARTEFAKT"
                              : "ZAPASY"}
                        </small>
                        <strong>{copy.name}</strong>
                        <p>
                          {copy.description}
                          {reward.type === "heal"
                            ? ` +${reward.value} HP.`
                            : reward.type === "gold"
                              ? ` +${reward.value} ziaren.`
                              : ""}
                        </p>
                        <span className="loot-choose">
                          {game.scene === "shop"
                            ? `${reward.price} ziaren`
                            : "Wybierz →"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {game.scene === "shop" && (
                  <button className="secondary" onClick={actions.skipShop}>
                    Ruszaj dalej
                  </button>
                )}
              </section>
            ) : (
              <section className="end-panel">
                <span className="end-emblem">
                  {game.scene === "run-complete" ? "♛" : "⚔"}
                </span>
                <span className="eyebrow">
                  {game.scene === "run-complete"
                    ? "KURNIK MA NOWEGO KRÓLA"
                    : "TA HISTORIA JESZCZE SIĘ NIE KOŃCZY"}
                </span>
                <h2>
                  {game.scene === "run-complete"
                    ? "Chwała Kurczokerowi!"
                    : "Tym razem poleciały pióra."}
                </h2>
                <p>
                  {game.scene === "run-complete"
                    ? "Jajokról pokonany. Twoja wyprawa przechodzi do legendy."
                    : "Każda wyprawa czegoś uczy. Spróbuj innej drogi i nowych wzmocnień."}
                </p>
                <div className="end-stats">
                  <span>
                    <b>{game.run.completedNodeIds.length}</b> odwiedzonych
                    miejsc
                  </span>
                  <span>
                    <b>{game.run.artifacts.length}</b> artefaktów
                  </span>
                </div>
                <button className="primary" onClick={newRun}>
                  Nowa wyprawa →
                </button>
              </section>
            )}
          </div>
        )}
      </main>
      {started && game.scene === "map" && (
        <section className="route-selection">
          <div>
            <span className="eyebrow">KOLEJNY RUCH NALEŻY DO CIEBIE</span>
            <p>
              {game.run.currentNodeId === "start"
                ? "Pierwsza potyczka czeka za rogiem."
                : "Wybierz nagrodę, ryzyko albo chwilę oddechu."}
            </p>
          </div>
          <div className="route-options">
            {routes.map((n) => {
              const copy = ROUTE_COPY[n.type];
              return (
                <button
                  className={`route-option ${n.type === "boss" ? "boss-route" : ""}`}
                  key={n.id}
                  data-route-id={n.id}
                  onClick={() => selectNode(n.id)}
                >
                  <span>{copy[0]}</span>
                  <div>
                    <small>{copy[1]}</small>
                    <strong>{copy[2]} →</strong>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
      {battle && sim && (
        <Controls
          sim={sim}
          snapshot={snapshot}
          paused={paused || loading}
          abilities={game.run.abilities}
          selected={selectedAbility}
          onSelect={actions.selectAbility}
          fire={fire}
          onPause={() => pause(!pausedRef.current)}
        />
      )}
      <footer className="game-footer">
        <span role="status">
          {notice ||
            (battle
              ? ABILITY_COPY[selectedAbility]?.description
              : "✦  Każda wielka legenda zaczyna się od małego jajka.")}
        </span>
        <span
          className="performance"
          data-performance={stats ? JSON.stringify(stats) : ""}
        >
          {stats ? `${stats.fps} FPS` : ""} ·{" "}
          <select
            aria-label="Jakość grafiki"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
          >
            <option value="auto">Auto</option>
            <option value="high">Wysoka</option>
            <option value="low">Oszczędna</option>
          </select>
        </span>
      </footer>
      {(paused || help) && (
        <div className="modal-backdrop">
          <section
            className="pause-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={help ? "Jak grać" : "Przerwa w wyprawie"}
          >
            <span className="eyebrow">CHWILA DLA BOHATERA</span>
            <h2>
              {help
                ? "Jeden ruch. Wielkie możliwości."
                : "Grzęda może poczekać."}
            </h2>
            {help ? (
              <>
                <p>
                  Masz 20 sekund na ruch, skok i jedną akcję. Celuj myszą lub
                  ustaw kąt oraz moc suwakami. Linia pokazuje prawdziwy lot
                  jajobomby.
                </p>
                <dl>
                  <dt>A / D lub ← / →</dt>
                  <dd>Ruch po arenie</dd>
                  <dt>W lub ↑</dt>
                  <dd>Skok na platformę</dd>
                  <dt>SPACJA / ENTER</dt>
                  <dd>Wybrana zdolność</dd>
                  <dt>ESC</dt>
                  <dd>Pauza</dd>
                </dl>
                <p>
                  Na telefonie używaj przycisków pod areną. Po zwycięstwie
                  wybierasz nagrodę. Skorupa i strażnik blokują trafienie;
                  ziarno leczy i wzmacnia bombę.
                </p>
              </>
            ) : (
              <p>
                Gra jest zatrzymana. Zapis między starciami pozostaje w tej
                przeglądarce.
              </p>
            )}
            <button
              className="primary"
              onClick={() => {
                setHelp(false);
                pause(false);
              }}
            >
              Wróć do gry
            </button>
            {!help && (
              <button className="secondary" onClick={newRun}>
                Rozpocznij nową wyprawę
              </button>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
export default KurczokerCanvas;
