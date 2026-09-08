# KURCZOKER × DELTA240MVT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Execute inline in the existing branch/worktree, as explicitly requested by the user. Do not ask again to select an execution mode.

**Goal:** Wdrożyć zatwierdzoną grę z dziewięcioma szybkimi potyczkami, wyprawą na 10–15 minut, modelami 3D w kolorowej stylistyce retro, pełnym ruchem/lassem/destrukcją i markowym landingiem; sprawdzić ją i opublikować na Cloudflare.

**Architecture:** Jeden headless runtime Rapiera jest właścicielem bitwy. Maska materiałów generuje widoczną geometrię i kolizje; renderer oraz HUD odczytują stan i wysyłają polecenia. React/Zustand obsługuje przepływ dwóch trybów, a wersjonowany zapis przechowuje dane domenowe zamiast uchwytów fizyki.

**Tech Stack:** Astro static, React, Three.js/R3F, Rapier compat, Zustand, Node test runner, Playwright, glTF/meshopt/KTX2, IndexedDB, Cloudflare Pages; wersje z istniejącego `package-lock.json`.

**Spec:** `docs/superpowers/specs/2026-09-08-kurczoker-brand-redesign-design.md`, zaakceptowana w całości przez właściciela 2026-09-08 po commicie `f894d10`. Wykonawca czyta specyfikację i plan. Research: `docs/research/2026-09-08-kurczoker-rendering-cloudflare.md`.

## Global Constraints

- „Jeden kurczak gracza, bez zarządzania drużyną.”
- „Brak zegara decyzji i budżetu energii za chodzenie.”
- „Swobodny ruch, skoki i lasso od początku; lasso bez amunicji.”
- „Opcjonalnie jedno użycie narzędzia do drążenia, następnie jeden atak w turze.”
- „Rzeczywiste tunele i kratery; widok, kolizje i trajektoria respektują ten sam teren.”
- „Dziewięć różnych topografii dostępnych od razu w szybkiej potyczce.”
- „Wyprawa: trzy potyczki i boss, docelowo 10–15 minut typowej gry, stopniowe zdobywanie broni.”
- „Jedna druga szansa na wyprawę, zapis i czytelne zakończenia.”
- „Mobile od pierwszej grywalnej areny. Pion jest podstawowym układem, poziom pozostaje równie funkcjonalny.”
- „Walka zajmuje cały dostępny viewport. Kontrolki i HUD są nakładkami; nie ma otaczającego walkę landingu ani obowiązku obrotu telefonu.”
- „Wybrany kierunek wizualny A: jasny interfejs marki i ciepły, kolorowy świat retro.”
- „Odbiór wymaga rozegrania gry, nie samego sprawdzenia builda albo makiety.”
- Praca na `baza080926-makeover`, w bieżącym worktree; bez force push, resetowania zmian użytkownika i nowego worktree.
- Ruch i strzały w płaszczyźnie XY; pełne modele 3D; HUD bez pikselizacji; krok symulacji `1/60 s`.
- Jedna waluta — ziarenka; bez konta, opłat, multiplayera i synchronizacji między urządzeniami w tym wydaniu.
- Startowe liczby z sekcji 9 specyfikacji są balansem do testów. Nie zmieniać zasad tury dla uzyskania krótszej sesji.
- Cloudflare Pages: asset maksymalnie `25 MiB`; cel pierwszego pobrania do walki `10 MiB` skompresowanego transferu. Nie utożsamiać z obecną sumą nieskompresowanych plików.
- Emulacja viewportu w Codexie i test fizycznego telefonu to osobne dowody. Historyczne wyniki starej gry nie są wynikami redesignu.

## Sposób wykonania i granice zadań

Jeden plan spina zależne podsystemy: teren → ruch/lina → ataki → UI → treść → wyprawa → zapis → wydanie. Etapy M1 i M2 dają grywalne rezultaty przed kampanią; landing ma własne zadanie. Nie rozbijamy pracy na niezależne implementacje silnika.

Każde zadanie obejmuje cykl testowania zachowania i commit. Kroki z podpunktami implementacyjnymi wykonywać pojedynczo, kontrolując test po każdej zmianie. Dla mechanik test ma najpierw zawieść z powodu brakującego zachowania; nie akceptować jako RED literówki, błędu importu istniejącego modułu lub niedziałającego środowiska. Nowy moduł może zacząć od brakującego eksportu, po czym test musi sprawdzać wynik domenowy.

Przed commitem: testy zadania, `git diff --check`, przegląd diffu i staging wyłącznie wskazanych plików. Komenda commit w zadaniu określa temat; ścieżki do `git add --` wynikają z jego bloku Files i rzeczywistego diffu. Nie używać `git add .`. Po etapie wykonać zestaw zbiorczy; nie uruchamiać całego browser suite po każdej zmianie czystej funkcji.

W planie występują wykonywalne przykłady testów i konkretne fragmenty algorytmów. Fragment umieszcza się w opisanej funkcji, z importami wynikającymi z kontraktów. Nie kopiować wszystkich bloków do jednego pliku. Wartości fixture są małe i deterministyczne; grywalne mapy powstają oddzielnie.

## Mapa plików i odpowiedzialności

Ścieżki są względem repozytorium. **Create** oznacza planowany nowy plik, **Modify** istniejący punkt integracji. Nie tworzyć drugiego aktywnego runtime obok `tactical/simulation.js`.

| Files | Rola |
|---|---|
| Create `src/engine/tactical/config.js`, `contracts.js` | Wartości balansu, identyfikatory, JSDoc kontraktów |
| Create `src/engine/tactical/terrain/{mask,geometry,collisions}.js` | Maska materiałów, scalanie brył, adapter Rapiera |
| Create `src/engine/tactical/{character,rope,projectiles,weapons,enemyAI,turns}.js` | Ruch/lina i reguły walki |
| Modify `src/engine/tactical/{simulation,arena,ballistics}.js` | Jeden publiczny runtime, biblioteka map, wspólny tor pocisku |
| Create `src/engine/tactical/maps/{yard,hills,roofs,ravine,mill,caves,quarry,islands,fortress}.js` | Dane dziewięciu topografii |
| Create `src/engine/tactical/{input,camera,settings,assets}.js` | Czyste reguły wejścia, kadrowania, ustawień i loaderów |
| Create `src/engine/tactical/{BattleCamera,TerrainView,BattleHUD}.jsx` | Renderery/komponenty czytające dane |
| Modify `src/engine/{KurczokerCanvas,GameRuntime}.jsx`, `src/engine/scenes/{BattleScene,MapScene}.jsx`, `src/engine/tactical/{Controls,World,Chicken,Effects}.jsx` | Integracja istniejącej sceny i nowego UI |
| Create `src/engine/ui/{QuickSelect,ExpeditionMap,RewardPanel,ShopPanel,ResultPanel,SettingsPanel}.jsx` | Ekrany produktu; nazwy eksportów takie jak plik |
| Create `src/game/{quickBattle,expedition,expeditionRewards}.js` | Czyste reguły nowych trybów, bez starego `updateBattle` |
| Modify `src/engine/store/useGameStore.js` | Wywołania reducerów i jeden commit wyniku |
| Modify `src/engine/tactical/checkpoint.js`; Create `src/engine/tactical/saveStorage.js` | Schemat v2, integralność, walidacja, IndexedDB |
| Modify `src/game/audio.js`, `src/styles/game.css` | Dźwięki i responsywny HUD |
| Modify `src/pages/{index,gra,polityka-prywatnosci}.astro`; Create `src/components/KurczokerLanding.astro`, `src/styles/kurczoker-brand.css` | Landing i powłoka bez obciążania hero silnikiem |
| Modify `tools/{build-game-assets,prepare-release,deploy-pages}.mjs`, `src/engine/tactical/releaseManifest.json`, `public/_headers` | Assety, budżet i wydanie |
| Create `test/helpers/brandBattle.js`, `test/brand-*.test.js`, `test/visual/brand-*.test.js` | Pomocnicza arena i testy zachowań |
| Create `docs/qa/2026-09-08-kurczoker-brand-redesign.md` | Raport wykonanych testów, środowisk, pomiarów i URL |

## Wspólne kontrakty — nazwy obowiązujące w zadaniach

W `contracts.js` zapisać JSDoc poniższych struktur; nie wprowadzać TypeScript do całego projektu tylko dla tego planu.

```js
// Vec2 = {x:number,y:number}; materiały: 0=puste, 1=ziemia, 2=drewno, 3=fundament.
// MapDef = {id,name,summary,version,width,height,cellSize,chunkCells,shapes,spawns,safeZones,landmarks}
// shape = {id,kind:'rect',x,y,width,height,material}; współrzędne lewego dolnego rogu.
// spawns = [{id,team:'player'|'enemy',role,x,y}]; safeZones = [{x,y,width,height}].
// Inventory = {owned:string[],ammo:Record<string,number>,tools:{pickaxe:number,drill:number}}
// unlimited: broń w owned bez licznika ammo; nigdy Infinity w zapisie JSON.
// ActorSnapshot = {id,team,role,x,y,vx,vy,health,maxHealth,grounded,alive,lastSafe,guardAvailable}
// BattleOptions = {mapId?,map?,encounterId,mode:'quick'|'expedition',seed,
//   player:{health,maxHealth,inventory,upgrades:string[]},enemies?:[{id,role,health,maxHealth,x,y}]}
// Snapshot = {schemaVersion:2,mapId,mapVersion,encounterId,mode,seed,rngState,time,turn,
//   phase:'player'|'resolve'|'enemy'|'finished',paused,outcome:null|'won'|'lost',
//   actors,projectiles,mines,rope,terrain,inventory,upgrades,toolUsed,enemyQueue,
//   phaseElapsed,enemyPlan,enemyIndex,boss,selectedWeaponId,aim:{angleDeg,power},nextEventId,nextEntityId}
// RopeState = null | {anchor:Vec2,normal:Vec2,pivots:Vec2[],length:number,reelRate:number}
// Projectile = {id,ownerId,weaponId,x,y,vx,vy,age,fuse:number|null,bounces}
// Event = {id:string,type:string,time:number,payload:object}
// Command = {type:'move',direction:-1|0|1} | {type:'jump'}
// | {type:'aim',angleDeg:number,power:number}
// | {type:'select',weaponId:string} | {type:'attack'} | {type:'pass'}
// | {type:'rope.attach',point:Vec2} | {type:'rope.release'} | {type:'rope.reel',rate:-1|0|1}
// | {type:'tool',toolId:'pickaxe'|'drill',direction:-1|1}
// Receipt = {accepted:boolean,reason?:'phase'|'paused'|'blocked'|'range'|'empty'|'used'|'invalid'}
// createBattleSimulation(options:BattleOptions):Promise<BattleRuntime>
// restoreBattleSimulation(snapshot:Snapshot):Promise<BattleRuntime>
// BattleRuntime: dispatch(Command):Receipt; advance(seconds):void; setPaused(bool):void;
// snapshot():Snapshot; trajectory():Vec2[]; drainEvents():Event[]; dispose():void.
```

`snapshot()` zwraca niezależne dane serializowalne; renderer może używać osobnego odczytu lekkich transformacji, ale nie mutuje snapshotu. `map` służy też testom fixture. Runtime rejestruje jej ID/wersję; odtwarzanie testu przyjmuje mapę przez adapter danych, produkcja odtwarza tylko dziewięć znanych map. Dokładny wariant restore: `restoreBattleSimulation(snapshot, {map} = {})`. Brak opcjonalnego stanu zapisywać jako null lub pustą kolekcję, bez undefined/Infinity/NaN. Zapis obejmuje flagę pierwszego trafienia pancerza, lastSafe i stan rozpoczętej akcji AI. Przy odtworzeniu player phase wejście ruchu/zwijania jest neutralne, choć fizyczna prędkość pozostaje zapisana.

Identyfikatory broni: `jajooka`, `granajko`, `shotgun`, `kick`, `mine`, `cluster`. Publiczne copy: Jajooka, Granajko, Dubeltówka, Kopniak, Mina-jajo, Jajo kasetowe. Role: `shooter`, `grenadier`, `rusher`, `boss`.

## Task 01 (M0/M1): Materiały i wycinanie terenu z fixture testową

**Files:** Create `config.js`, `contracts.js`, `terrain/mask.js` w `src/engine/tactical/`; Create `test/helpers/brandBattle.js`, `test/brand-terrain.test.js`.

**Interfaces:** `createTerrain(map):Terrain`; Terrain `.materialAt(x,y):number`, `.cutCircle({x,y,radius}):number[]`, `.cutRect({x,y,width,height}):number[]`, `.snapshot():{revision,columns,rows,cells:number[],cellSize}`. Zwracane tablice to ID zmienionych fragmentów. Test helper `fixtureMap(overrides={})` zwraca płaską mapę 20×12, cellSize .125, chunkCells 32, ziemia `{x:0,y:0,width:20,height:2}`, odporny pas pod nią do y=.25, spawny (2,2.7)/(16,2.7), safe zone x1..3 przy y2.

- [x] Sprawdź `git status`, branch, `node --version`; jeśli brakuje runtime, użyj narzędzia bundled workspace dependencies. Uruchom `npm ci`, `npm test`, `npm run build`; zapisz rzeczywisty baseline w raporcie QA. Nie aktualizuj zależności bez potrzeby.
- [x] Dodaj test zachowania:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {createTerrain} from '../src/engine/tactical/terrain/mask.js';
import {fixtureMap} from './helpers/brandBattle.js';
test('krater usuwa ziemię, zachowuje fundament i podnosi rewizję raz', () => {
  const t = createTerrain(fixtureMap());
  const ids = t.cutCircle({x:2,y:1,radius:1.2});
  assert.ok(ids.length > 0);
  assert.equal(t.materialAt(2,1),0);
  assert.equal(t.materialAt(2,.125),3);
  assert.equal(t.snapshot().revision,1);
  assert.deepEqual(t.cutCircle({x:2,y:1,radius:1.2}),[]);
});
```

- [x] Uruchom `node --test test/brand-terrain.test.js` i zobacz RED.
- [x] Zaimplementuj płaską `Uint8Array`, rasteryzację prostokątów w kolejności i wycinanie tylko materiałów 1/2. Ogranicz zakres iteracji do bounding box operacji; przy braku zmiany nie zwiększaj rewizji. Rdzeń adresowania:

```js
const column = Math.floor(x / cellSize);
const row = Math.floor(y / cellSize);
const index = row * columns + column;
// Po sprawdzeniu 0 <= column < columns i 0 <= row < rows:
if (cells[index] === 1 || cells[index] === 2) cells[index] = 0;
```

- [x] Dodaj przypadki tunelu, ujemnych współrzędnych, granicy fragmentu, pustej operacji i snapshotu niezależnego od mutacji. Uruchom test ponownie, oczekuj PASS.
- [x] W config.js dodaj wspólny PRNG używany przez pociski i wyprawę. Przechowuj zwracany stan, nie tylko seed; test tego samego ciągu dla tego samego stanu i innego kolejnego stanu:

```js
export function nextRandom(state){
 const next=(Math.imul(state>>>0,1664525)+1013904223)>>>0;
 return {state:next,value:next/4294967296};
}
```

- [x] Commit: `feat: model destructible material terrain`.

## Task 02 (M1): Jedna geometria dla obrazu i kolizji

**Files:** Create `terrain/geometry.js`, `terrain/collisions.js`, `test/brand-terrain-collisions.test.js`.

**Interfaces:** `buildTerrainBoxes(snapshot,chunkIds?):{id,x,y,width,height,material}[]`; `syncTerrainColliders({R,world,terrain,registry,chunkIds}):void`, registry `Map<string,Collider>`. Prostokąty wynikowe mają x/y środka i wymiary; rysunek i Rapier konsumują tę samą listę.

- [x] Dodaj test na realnym Rapierze:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import R from '@dimforge/rapier3d-compat';
import {createTerrain} from '../src/engine/tactical/terrain/mask.js';
import {syncTerrainColliders} from '../src/engine/tactical/terrain/collisions.js';
import {fixtureMap} from './helpers/brandBattle.js';
await R.init();
test('po wycięciu tunelu promień nie trafia starej ściany', () => {
  const world = new R.World({x:0,y:-10,z:0});
  try {
    const terrain = createTerrain(fixtureMap()), registry = new Map();
    const sync = chunkIds => syncTerrainColliders({R,world,terrain,registry,chunkIds});
    sync(); world.step();
    const ray = new R.Ray({x:0,y:1,z:0},{x:1,y:0,z:0});
    assert.ok(world.castRay(ray,20,true));
    sync(terrain.cutRect({x:0,y:.5,width:20,height:1})); world.step();
    assert.equal(world.castRay(ray,20,true),null);
  } finally { world.free(); }
});
```

- [x] Uruchom `node --test test/brand-terrain-collisions.test.js`, potwierdź RED i lokalne API Rapiera.
- [x] Scalaj poziome runy jednakowego materiału i pionowo runy o identycznym x/width/material wewnątrz fragmentu. Usuwaj stare collidery tylko zmienionych fragmentów; dodawaj nowe:

```js
const collider = world.createCollider(
  R.ColliderDesc.cuboid(box.width/2, box.height/2, 1.2)
    .setTranslation(box.x,box.y,0).setFriction(.85)
);
registry.set(box.id,collider);
```

- [x] Sprawdź mapę materiałów vs pokrycie boxami, granice fragmentów i brak nakładających się brył; uruchom oba testy terenu, oczekuj PASS.
- [x] Commit: `feat: rebuild terrain collision from material edits`.

## Task 03 (M1): Dynamiczny kurczak i stały krok runtime

**Files:** Create `character.js`; Modify `simulation.js`, `config.js`, `test/helpers/brandBattle.js`; Create `test/brand-character.test.js`.

**Interfaces:** `createCharacter({R,world,spawn,health,maxHealth}):Character`; `.step({direction,jump},dt)`, `.snapshot():ActorSnapshot`, `.dispose()`. Runtime z kontraktu przyjmuje fixture `map`. Helper `testBattle(overrides={}):Promise<BattleRuntime>` tworzy fixture, player100HP, owned Jajooka/Kopniak, 2 kilofy/2 wiertła; `stepFor(sim,seconds)` wywołuje stałe kroki.

- [x] Dodaj test:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {testBattle,stepFor} from './helpers/brandBattle.js';
test('ruch i skok wracają na podłoże, pauza zatrzymuje stan', async () => {
  const s = await testBattle();
  try {
    stepFor(s,1);
    const start = s.snapshot().actors.find(a=>a.team==='player');
    s.dispatch({type:'move',direction:1}); stepFor(s,.3);
    assert.ok(s.snapshot().actors[0].x > start.x);
    assert.equal(s.dispatch({type:'jump'}).accepted,true); stepFor(s,.1);
    assert.ok(s.snapshot().actors[0].y > start.y);
    s.dispatch({type:'move',direction:0}); stepFor(s,2);
    assert.ok(s.snapshot().actors[0].grounded);
    s.setPaused(true); const saved=s.snapshot(); s.advance(90);
    assert.deepEqual(s.snapshot(),saved);
  } finally { s.dispose(); }
});
```

- [x] Uruchom `node --test test/brand-character.test.js`, oczekuj RED.
- [x] Utwórz kapsułę dynamiczną i zablokuj głębię/obroty przez API sprawdzone w lokalnych `.d.ts`:

```js
const desc = R.RigidBodyDesc.dynamic().setTranslation(spawn.x,spawn.y,0);
const body = world.createRigidBody(desc);
body.setEnabledTranslations(true,true,false,true);
body.setEnabledRotations(false,false,false,true);
world.createCollider(R.ColliderDesc.capsule(.25,.3).setFriction(.7),body);
```

- [x] Dodaj ray/shape cast pod stopy, skok tylko grounded, kontrolę poziomej prędkości, ograniczenie nadrabiania do maksymalnie 8 kroków na frame i `advance` no-op przy pauzie/dispose. Usuń decyzję kończącą turę po `TURN_SECONDS`.
- [x] Testuj sufit, cienką ścianę, zmieniony grunt i równoważny ruch przy frame delta 1/30 i 1/60; `node --test test/brand-character.test.js` PASS.
- [x] Commit: `feat: drive chicken movement through fixed physics steps`.

## Task 04 (M1): Bezpieczny upadek i stan postaci po odrzucie

**Files:** Modify `character.js`, `simulation.js`; Create `test/brand-falls.test.js`.

**Interfaces:** `findSafeReturn({terrain,actors,safeZones,lastSafe,actorSize}):Vec2|null` w character.js; po powrocie zeruj prędkość, odczep linę, nalicz 20% maxHP raz na zdarzenie. Brak bezpiecznego punktu oznacza porażkę tej postaci z eventem, nie teleport do ściany.

- [x] Test w `brand-falls.test.js` używa fixture z dwoma wyspami i spawnu nad szczeliną:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {testBattle,fixtureMap,stepFor} from './helpers/brandBattle.js';
test('wpadnięcie w szczelinę kosztuje HP raz i przywraca wolne miejsce', async()=>{
  const map=fixtureMap({shapes:[
    {id:'safe',kind:'rect',x:0,y:0,width:4,height:2,material:3},
    {id:'far',kind:'rect',x:14,y:0,width:6,height:2,material:3}
  ],spawns:[{id:'player',team:'player',role:'hero',x:7,y:3},
    {id:'enemy-1',team:'enemy',role:'shooter',x:16,y:2.7}]});
  const s=await testBattle({map});
  try { stepFor(s,5); const p=s.snapshot().actors[0];
    assert.equal(p.health,80); assert.ok(p.x>=1 && p.x<=3);
    assert.equal(s.drainEvents().filter(e=>e.type==='fall').length,1);
  } finally {s.dispose();}
});
```

- [x] `node --test test/brand-falls.test.js` → RED.
- [x] Oceniaj strefy safe przez maskę i shape query; kolejność: poprawny lastSafe, najbliższy poprawny punkt strefy, null. Nalicz:

```js
actor.health = Math.max(0, actor.health - Math.ceil(actor.maxHealth * .2));
// Dopiero po wykryciu przejścia poza dolną granicę; nie co klatkę pobytu pod nią.
```

- [x] Dodaj przypadki śmierci przy niskim HP, zniszczonego lastSafe i takiej samej reguły dla wroga; test PASS.
- [x] Commit: `feat: resolve arena falls without unsafe respawns`.

## Task 05 (M1): Zaczep lassa, huśtanie i puszczenie

**Files:** Create `rope.js`; Modify `simulation.js`, `character.js`; Create `test/brand-rope.test.js`.

**Interfaces:** `createRope({world,playerBody,terrain}):Rope`; `.attach(point):Receipt`, `.release():void`, `.reel(rate):void`, `.step(dt):void`, `.snapshot():RopeState`. Runtime obsługuje komendy `rope.*`. Początkowy zasięg 18 jednostek, długość min1.2/max18; prędkość zwijania4 jednostki/s.

- [x] Testuj realną mapę z belką nad bohaterem:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {testBattle,fixtureMap,stepFor} from './helpers/brandBattle.js';
test('lina kotwiczy na belce i puszcza bez wyzerowania pędu',async()=>{
 const base=fixtureMap();
 const map=fixtureMap({shapes:[...base.shapes,
  {id:'beam',kind:'rect',x:1,y:7,width:7,height:1,material:2}]});
 const s=await testBattle({map});
 try {
  assert.equal(s.dispatch({type:'rope.attach',point:{x:4,y:7}}).accepted,true);
  s.dispatch({type:'rope.reel',rate:-1}); stepFor(s,.5);
  s.dispatch({type:'rope.reel',rate:0}); s.dispatch({type:'move',direction:1});
  stepFor(s,.3); const before=s.snapshot().actors[0];
  assert.equal(s.dispatch({type:'rope.release'}).accepted,true);
  assert.equal(s.snapshot().rope,null);
  assert.equal(s.snapshot().actors[0].vx,before.vx);
 } finally {s.dispose();}
});
```

- [x] `node --test test/brand-rope.test.js` → RED.
- [x] Raycastuj od bohatera do celu; przyjmij tylko pierwszą trafioną powierzchnię w tolerancji punktu. Ograniczenie długości działa na dynamiczne ciało, bez `setTranslation` przez ściany. Dobierz rope joint dostępny w lockfile lub własny impuls ograniczający prędkość radialną, używając kolizji Rapiera. Zwijanie:

```js
rope.length = Math.max(1.2,Math.min(18,rope.length + rope.reelRate*4*dt));
```

- [x] Sprawdź odmowę pustego/przesłoniętego/odległego zaczepu, brak amunicji, stabilne naprężenie, brak teleportacji przy skracaniu; test PASS.
- [x] Commit: `feat: add physical grapple movement and release`.

## Task 06 (M1): Lina na narożnikach i zniszczony zaczep

**Files:** Modify `rope.js`, `terrain/geometry.js`; Create `test/brand-rope-obstacles.test.js`.

**Interfaces:** `traceRopePath({anchor,player,pivots,terrain}):Vec2[]` w rope.js, lista w kolejności anchor→player; Terrain geometry eksportuje `boundaryCorners(snapshot):Vec2[]` tylko odsłoniętych narożników. Limit12 pivotów chroni przed pętlą; przy braku legalnej trasy puszczenie z eventem, nie przenikanie.

- [x] Test czystej geometrii:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {createTerrain} from '../src/engine/tactical/terrain/mask.js';
import {traceRopePath} from '../src/engine/tactical/rope.js';
import {fixtureMap} from './helpers/brandBattle.js';
test('prowadzenie omija ścianę i znika po wycięciu przeszkody',()=>{
 const t=createTerrain(fixtureMap({shapes:[
  {id:'wall',kind:'rect',x:8,y:2,width:2,height:4,material:1}]}));
 const input={anchor:{x:3,y:4},player:{x:15,y:4},pivots:[],terrain:t};
 const pivots=traceRopePath(input); assert.ok(pivots.length>0);
 t.cutRect({x:8,y:2,width:2,height:4});
 assert.deepEqual(traceRopePath({...input,pivots}),[]);
});
```

- [x] `node --test test/brand-rope-obstacles.test.js` → RED.
- [x] Dodaj narożnik pierwszej przeszkody z minimalną legalną długością i zachowaniem strony owijania. Zwalniaj pivot, gdy poprzedni i następny punkt widzą się z marginesem. Długość dostępna dla ostatniego odcinka:

```js
let used=0, previous=rope.anchor;
for (const p of rope.pivots) {used+=Math.hypot(p.x-previous.x,p.y-previous.y);previous=p;}
const freeLength=Math.max(.2,rope.length-used);
```

- [x] Przy rewizji terenu sprawdź kotwicę i wszystkie pivoty. Testuj usunięcie kotwicy, granice fragmentów, powrót tą samą drogą i deterministyczny limit; oba testy liny PASS.
- [x] Commit: `feat: route grapple around destructible terrain corners`.

## Task 07 (M1): Jajooka i podgląd wspólnej trajektorii

**Files:** Create `projectiles.js`, `weapons.js`; Modify `ballistics.js`, `simulation.js`; Create `test/brand-projectiles.test.js`.

**Interfaces:** `launchVelocity(angleDeg,power):{x,y,z:0}` pełny kąt -180..180; `stepProjectile(projectile,dt,castSegment):{projectile,hit}`; `predictTrajectory({origin,angleDeg,power,dt,maxSteps,castSegment}):Vec2[]`. Rzeczywisty lot i podgląd wywołują ten sam krok; kolizja swept segment/shape zamiast próbkowania tylko pozycji końcowej. `explode({id,point,radius,maxDamage,ownerId},battle):void` w weapons.js.

- [x] Test:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {testBattle,stepFor} from './helpers/brandBattle.js';
test('pierwszy pocisk idzie po podglądzie i nie można wystrzelić dwa razy',async()=>{
 const s=await testBattle();
 try {s.dispatch({type:'aim',angleDeg:45,power:10});
  const preview=s.trajectory();
  assert.equal(s.dispatch({type:'attack'}).accepted,true);
  assert.equal(s.dispatch({type:'attack'}).accepted,false);
  stepFor(s,10/60); const p=s.snapshot().projectiles[0];
  assert.ok(Math.hypot(p.x-preview[10].x,p.y-preview[10].y)<.05);
 }finally{s.dispose();}
});
```

- [x] `node --test test/brand-projectiles.test.js` → RED.
- [x] Zastąp ograniczony stary kąt i użyj jednego integratora:

```js
const radians=angleDeg*Math.PI/180;
const velocity={x:Math.cos(radians)*power,y:Math.sin(radians)*power,z:0};
// W obu ścieżkach: vx bez wiatru; vy += gravity*dt; next=position+velocity*dt.
```

- [x] Eksplozja: ustal trafionych i osłoniętych na starej geometrii, nalicz raz obrażenia/impuls, wytnij krater, zsynchronizuj teren i unieważnij cache. Testuj strzał lewo/dół, self-hit, miss, ścianę i cienki collider.
- [x] `node --test test/brand-projectiles.test.js test/brand-terrain-collisions.test.js` PASS; commit `feat: share ballistics between preview and real attacks`.

## Task 08 (M1): Kilof i wiertło z kosztem jednej akcji narzędzia

**Files:** Modify `weapons.js`, `simulation.js`; Create `test/brand-tools.test.js`.

**Interfaces:** `toolArea({toolId,actor,direction}):{x,y,width,height}` oraz `previewTool(command,snapshot,terrain):{area,allowed,reason?}` w weapons.js. Kilof obszar szer.2.5/wys.1.5 przed graczem; wiertło szer.1.5/wys.2.5 pod nim. Ziemia i drewno podatne, fundament odporny.

- [x] Test:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {testBattle} from './helpers/brandBattle.js';
test('jedno wiercenie pozwala jeszcze strzelić, drugie nie zużywa zapasu',async()=>{
 const s=await testBattle();
 try {assert.equal(s.dispatch({type:'tool',toolId:'drill',direction:1}).accepted,true);
  assert.equal(s.snapshot().inventory.tools.drill,1);
  assert.equal(s.dispatch({type:'tool',toolId:'drill',direction:1}).accepted,false);
  assert.equal(s.snapshot().inventory.tools.drill,1);
  assert.equal(s.dispatch({type:'attack'}).accepted,true);
 }finally{s.dispose();}
});
```

- [x] `node --test test/brand-tools.test.js` → RED.
- [x] Zatwierdzaj atomowo, po sprawdzeniu czy przynajmniej jedna komórka zmieni się:

```js
if (state.toolUsed) return {accepted:false,reason:'used'};
if (state.inventory.tools[toolId] <= 0) return {accepted:false,reason:'empty'};
const changed=terrain.cutRect(area);
if (!changed.length) return {accepted:false,reason:'blocked'};
state.inventory.tools[toolId]--; state.toolUsed=true;
```

- [x] Testuj anulowany podgląd bez kosztu, pusty zapas, fundament, przejście postaci przez tunel i rewizję trajektorii; test PASS.
- [x] Commit: `feat: add limited digging tools before the turn attack`.

## Task 09 (M1): Fazy tury, odpowiedź jednego wroga i wynik

**Files:** Create `turns.js`, `enemyAI.js`; Modify `simulation.js`; Create `test/brand-turns.test.js`.

**Interfaces:** `nextPhase(state):state` w turns.js; `planEnemyAction({actor,snapshot,terrain}):{moveDirection,moveSeconds,weaponId,angleDeg,power}|null` w enemyAI.js. Na tym etapie shooter wybiera balistyczny strzał i krótki ruch; task15 rozwija role.

- [x] Test:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {testBattle,stepFor} from './helpers/brandBattle.js';
test('namysł nie kończy tury, pass daje widoczny atak wroga i nową turę',async()=>{
 const s=await testBattle();
 try {stepFor(s,30); assert.equal(s.snapshot().turn,1);
  assert.equal(s.snapshot().phase,'player');
  s.dispatch({type:'pass'}); let visible=false;
  for(let i=0;i<900 && s.snapshot().turn===1;i++){
   s.advance(1/60); visible ||= s.snapshot().projectiles.some(p=>p.ownerId==='enemy-1');
  }
  assert.ok(visible); assert.equal(s.snapshot().turn,2);
 }finally{s.dispose();}
});
```

- [x] `node --test test/brand-turns.test.js` → RED.
- [x] Kolejka jest snapshotem ID żywych wrogów po ataku gracza. Pomijaj zmarłego wroga. Reguła wyniku ma pierwszeństwo przed nową turą:

```js
const player=state.actors.find(a=>a.team==='player');
const enemiesAlive=state.actors.some(a=>a.team==='enemy' && a.health>0);
state.outcome=player.health<=0?'lost':!enemiesAlive?'won':null;
if(state.outcome) state.phase='finished';
```

- [x] Dodaj telegraph .7s, ruch max1.5s, jeden attack; projectile TTL8s, resolve nie czeka na bezruch liny/dym. Pause zatrzymuje wszystkie te czasy. Testuj podwójny wynik, jednoczesną śmierć, trup w kolejce i wiszącego gracza.
- [x] Testy tur i pocisków PASS; commit `feat: resolve untimed player turns and enemy responses`.

## Task 10 (M1): Arbitraż dotyku i klawiatury bez przypadkowych strzałów

**Files:** Create `input.js`; Modify `Controls.jsx`; Create `test/brand-input.test.js`.

**Interfaces:** `createInputRouter(emit):{press(id,action),release(id),clear(),setMode(mode),mode()}`; action `left|right|jump|reel-in|reel-out`. Identyfikatory pointerId i code klawiatury są osobne. Mode `move|aim|rope|tool|overview|menu`. Akcja attack jest wyłącznie kliknięciem jawnego przycisku, nie release pointera.

- [x] Test:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {createInputRouter} from '../src/engine/tactical/input.js';
test('puszczenie skoku nie puszcza trzymanego ruchu i nie strzela',()=>{
 const events=[],r=createInputRouter(e=>events.push(e));
 r.press('p1','right'); r.press('p2','jump'); r.release('p2');
 assert.equal(events.at(-1).direction,1);
 assert.equal(events.some(e=>e.type==='attack'),false);
 r.clear(); assert.deepEqual(events.at(-1),{type:'move',direction:0});
});
```

- [x] `node --test test/brand-input.test.js` → RED.
- [x] Trzymaj Map aktywnych pointerów; policz kierunek ze zbioru zamiast zerować ruch przy każdym release. `release` publikuje aktualny kierunek, nawet jeśli zmienił się tylko skok; `clear` wysyła najpierw zero zwijania, potem zero ruchu. Podłącz blur, visibilitychange, pointercancel, lostpointercapture i zmianę orientacji.

```jsx
<button aria-label="Skok" onPointerDown={e=>{
 e.currentTarget.setPointerCapture(e.pointerId);
 router.press(`p${e.pointerId}`,'jump');
}} onPointerUp={e=>router.release(`p${e.pointerId}`)}
 onPointerCancel={()=>router.clear()}>Skok</button>
```

- [x] Ustaw Space=jump, R=lasso/puszczenie, A/D i strzałki=ruch, W/S=długość; ignoruj editable/repeat dla jednorazowych akcji. Test kombinacji klawiatura+dotyk, menu i usunięcia event listenerów PASS.
- [x] Commit: `feat: support simultaneous mobile movement and actions`.

## Task 11 (M1): Kamera śledząca i przegląd szerokiej areny

**Files:** Create `camera.js`, `BattleCamera.jsx`; Modify `GameRuntime.jsx`; Create `test/brand-camera.test.js`.

**Interfaces:** `cameraTarget({viewport,bounds,actor,projectile,rope,mode,overviewCenter,dt,previous}):{x,y,visibleHeight,zoom}`; kamera ortograficzna XY, zoom=viewport.height/visibleHeight. Normalna wysokość10, rope do18; overview dopasowuje bounds z marginesem.

- [x] Test:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraTarget} from '../src/engine/tactical/camera.js';
test('pion zachowuje rozmiar bohatera zamiast wciskać 72 jednostki mapy',()=>{
 const c=cameraTarget({viewport:{width:390,height:844},bounds:{width:72,height:26},
 actor:{x:30,y:5,vx:0,vy:0},projectile:null,rope:null,mode:'move',
 overviewCenter:null,dt:1/60,previous:null});
 assert.ok(c.visibleHeight<=12); assert.ok(c.zoom*1.1>=48);
 assert.ok(Math.abs(c.x-30)<1);
});
```

- [x] `node --test test/brand-camera.test.js` → RED.
- [x] Zastąp `FitCamera` tylko w bitwie; mapa wyprawy ma osobny kadr. Smoothing zależny od czasu:

```js
const alpha=1-Math.exp(-8*dt);
const smooth=(from,to)=>from+(to-from)*alpha;
```

- [x] Podłącz „Mapa” i „Do kurczaka”, zoom oraz drag tylko w overview. Kamera śledzi aktywny pocisk, po efekcie wraca do aktora. Test portrait/landscape, krawędzi mapy i obrotu bez skoku stanu PASS.
- [x] Commit: `feat: follow movement and shots with a portrait-first camera`.

## Task 12 (M1): Pierwsza kompletna arena w aplikacji

**Files:** Create `TerrainView.jsx`, `BattleHUD.jsx`, `test/visual/brand-foundation.test.js`; Modify `KurczokerCanvas.jsx`, `GameRuntime.jsx`, `scenes/BattleScene.jsx`, `Controls.jsx`, `World.jsx`, `src/pages/gra.astro`, `src/styles/game.css`, `arena.js`; Create `maps/yard.js`.

**Interfaces:** `TerrainView({terrainSnapshot})` używa task02; `BattleHUD({snapshot,onCommand,onPause,onMode})`; `BattleScene({sim,...callbacks})` zachowuje jeden advance/frame. `getMap(id):MapDef` i `listMaps():MapDef[]` w arena.js zaczynają od yard. Tymczasowe wejście `/gra?mode=quick` otwiera Podwórze bez nadpisywania legacy zapisu.

- [x] Dodaj browser test na buildzie z istniejącym `serveBuild()`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {serveBuild} from './server.js';
test('Podwórze działa przez UI w pionie',{timeout:120000},async()=>{
 const host=process.env.KURCZOKER_VISUAL_BASE_URL
  ?{url:process.env.KURCZOKER_VISUAL_BASE_URL,close:async()=>{}}:await serveBuild();
 const browser=await chromium.launch();
 try {const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await page.goto(host.url+'/gra?mode=quick');
  await page.getByRole('button',{name:'Rozpocznij potyczkę',exact:true}).click();
  await page.getByRole('button',{name:'Skok',exact:true}).waitFor();
  await page.getByRole('button',{name:'Pauza',exact:true}).click();
  await page.getByRole('dialog',{name:'Pauza'}).waitFor();
  await page.getByRole('button',{name:'Wznów grę',exact:true}).click();
  const dims=await page.evaluate(()=>({w:innerWidth,doc:document.documentElement.scrollWidth}));
  assert.equal(dims.w,dims.doc);
 }finally{await browser.close();await host.close();}
});
```

- [x] Build + `node --test test/visual/brand-foundation.test.js` → RED. Jeżeli maszyna wymaga SwiftShader, użyj istniejących flag z `tactical.test.js` i oznacz to w raporcie.
- [x] Podłącz komendy zamiast starego `sim.move/fire`, renderuj listę actors/projectiles i teren z rewizji. Canvas full viewport:

```css
.battle-screen{position:fixed;inset:0;height:100dvh;overflow:hidden;}
.battle-hud{position:absolute;inset:0;pointer-events:none;}
.battle-hud button,.battle-hud input{pointer-events:auto;min-height:48px;}
.battle-controls{padding-bottom:max(12px,env(safe-area-inset-bottom));}
```

- [x] Zrób jedno przejście w Codexie: chodzenie → skok → zaczep → huśtanie → puszczenie → drążenie → strzał → odpowiedź → wynik. Powtórz pion/poziom, sprawdź wizualnie model i zniszczone przejście. Nie kończ M1 na samym smoke teście powyżej.
- [x] `npm test`, `npm run build`, foundation browser test PASS; przejrzyj zmienione legacy testy pod kątem starych zasad. Commit `feat: ship the first playable touch-ready arena`.

## Task 13 (M2): Pozostałe pięć broni i czytelne efekty

**Files:** Modify `config.js`, `weapons.js`, `projectiles.js`, `simulation.js`, `Effects.jsx`, `BattleHUD.jsx`; Create `test/brand-arsenal.test.js`.

**Interfaces:** `WEAPONS` w config; `executeWeapon({weaponId,actor,aim,battle}):Receipt` w weapons. `tickMines(mines,actors,dt):{mines,explosions}` oraz `spawnClusterFragments(projectile,nextId):Projectile[]` w projectiles. Każdy handler korzysta z `explode` z task07; inventory należy do runtime, nie do widoku.

- [ ] Dodaj tabelaryczny test dostępu i zużycia:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {testBattle} from './helpers/brandBattle.js';
for (const weaponId of ['granajko','shotgun','mine','cluster']) {
 test(weaponId+' zużywa tylko jeden ładunek',async()=>{
  const s=await testBattle({player:{health:100,maxHealth:100,upgrades:[],inventory:{
   owned:['jajooka','kick',weaponId],ammo:{[weaponId]:1},tools:{pickaxe:0,drill:0}}}});
  try{s.dispatch({type:'select',weaponId});
   assert.equal(s.dispatch({type:'attack'}).accepted,true);
   assert.equal(s.snapshot().inventory.ammo[weaponId],0);
   assert.equal(s.dispatch({type:'attack'}).accepted,false);
  }finally{s.dispose();}
 });
}
```

- [ ] `node --test test/brand-arsenal.test.js` → RED.
- [ ] Wprowadź definicje, zachowując liczby ze specyfikacji:

```js
export const WEAPONS = {
 jajooka:{kind:'impact',damage:30,radius:1.8},
 granajko:{kind:'bounce',damage:35,radius:2,fuse:2.5,restitution:.55},
 shotgun:{kind:'cone',damage:40,range:5,spreadDeg:12,pellets:5},
 kick:{kind:'contact',damage:10,range:1.2,impulse:6},
 mine:{kind:'mine',damage:35,radius:2,armSeconds:.8,triggerRadius:.8},
 cluster:{kind:'cluster',damage:0,fuse:2.5,fragments:5,fragmentDamage:12}
};
```

- [ ] Granajko: odbijaj prędkość `v' = v - (1+e)(v·n)n`; fuse liczy czas symulacji. Śrut: 5 raycastów w stożku, łączny limit40, zasięg5, każda ściana blokuje swój promień. Kopniak: najbliższy żywy wróg w zasięgu i bez ściany.
- [ ] Mina: postaw na wolnym gruncie przy bohaterze, uzbrój po .8s, reaguj na obie drużyny; nie detonuj od powtórzonego eventu. Cluster: pięć kierunków rozrzutu z zapisanego PRNG, limit liczby/times życia, każdy fragment korzysta z tej samej eksplozji. Dodaj testy odbicia, pauzy zapalnika, śrutu przez ścianę, pustego kopnięcia, własnej miny i ograniczonej liczby odłamków.
- [ ] `node --test test/brand-arsenal.test.js test/brand-projectiles.test.js` PASS; obejrzyj rzeczywisty efekt każdej broni. Commit `feat: complete the six-weapon tactical arsenal`.

## Task 14 (M2): Dziewięć różnych topografii i walidacja przejść

**Files:** Create pozostałe osiem `maps/*.js` z tabeli plików; Modify `maps/yard.js`, `arena.js`, `World.jsx`; Create `test/brand-maps.test.js`.

**Interfaces:** MapDef z kontraktu; `listMaps()` w stałej kolejności specyfikacji, `getMap(id)` zwraca znaną mapę lub zgłasza błąd. `validateMap(map):{ok:boolean,errors:string[]}` w arena sprawdza rozmiary, ID, materiał, wolne spawny i bezpieczne strefy. `inspectTraversal(map):{reachableSpawnPairs:boolean,clearanceFailures:string[]}` stosuje ten sam rozmiar kapsuły i dostęp do podstawowego lassa; wynik heurystyki nie zastępuje grania.

- [ ] Test:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {listMaps,validateMap} from '../src/engine/tactical/arena.js';
test('biblioteka ma dziewięć poprawnych i różnych geometrii',()=>{
 const maps=listMaps(); assert.equal(maps.length,9);
 assert.equal(new Set(maps.map(m=>JSON.stringify(m.shapes))).size,9);
 for(const map of maps) assert.deepEqual(validateMap(map),{ok:true,errors:[]},map.id);
});
```

- [ ] `node --test test/brand-maps.test.js` → RED.
- [ ] Każdy plik mapy eksportuje jeden MapDef. Użyj bazowych prostokątów poniżej jako konkretnego początku geometrii, potem dodaj opisane w specyfikacji półki/mosty/osłony i landmarks. Format skrótu `[x,y,width,height,material]`; najpierw fundamenty, potem miękki teren. Sufit jaskini nie jest pełnym wypełnieniem komór.

```js
const terrainSeeds = {
 yard:[[0,0,48,.5,3],[0,.5,48,2,1],[12,2.5,6,1.5,1],[30,2.5,5,3,1]],
 hills:[[0,0,64,.5,3],[0,.5,64,2,1],[0,2.5,18,4,1],[0,6.5,10,4,1],[46,2.5,18,4,1],[54,6.5,10,4,1]],
 roofs:[[0,0,60,2,3],[5,2,10,6,1],[22,2,10,10,1],[40,2,12,7,1],[4,8,12,.5,2],[21,12,12,.5,2]],
 ravine:[[0,0,18,8,1],[38,0,18,8,1],[18,3,5,1,3],[28,2,5,1,3],[18,8,20,.5,2]],
 mill:[[0,0,48,2,3],[20,2,8,24,1],[12,8,8,.6,2],[28,15,8,.6,2],[14,22,6,.6,2]],
 caves:[[0,0,64,2,3],[0,2,2,18,1],[62,2,2,18,1],[0,20,64,3,1],[20,2,2,12,1],[42,7,2,13,1],[22,8,10,1,1]],
 quarry:[[0,0,64,.5,3],[0,.5,64,3,1],[0,3.5,14,5,1],[20,3.5,14,9,1],[40,3.5,10,5,1],[56,3.5,8,13,1]],
 islands:[[0,0,18,5,1],[28,0,16,9,1],[56,0,16,6,1],[18,5,10,.5,2],[44,6,12,.5,2]],
 fortress:[[0,0,64,2,3],[4,2,8,18,1],[50,2,10,20,1],[16,2,32,3,1],[16,5,3,8,1],[45,5,3,8,1],[12,13,7,.6,2]]
};
// Przekształcenie w każdym pliku mapy: dane są jawne, nie losowane przy imporcie.
const id='hills', rows=terrainSeeds[id]; // W każdym pliku właściwe id oraz jego dane.
const shapes=rows.map(([x,y,width,height,material],i)=>({
 id:`${id}-${i}`,kind:'rect',x,y,width,height,material
}));
```

- [ ] Ustal spawny nad faktycznym podłożem (capsule half-height .55 + margines), odporne strefy powrotu i zaczepy w zasięgu18. Wszystkie przejścia do wysokości mają stopnie/lasso; Stary młyn nie wymaga skoku24 jednostek. Dodaj odpowiednie tunele/schody przez puste odstępy między shape'ami, nie niewidzialne teleporty.
- [ ] Każdą mapę przejdź i rozegraj w pionie/poziomie: alternatywa po zniszczeniu mostu, dostęp do wroga i działanie min. Zapisz dziewięć wierszy wyników w QA. Testy maps/terrain PASS; commit `feat: add nine distinct traversable battle maps`.

## Task 15 (M2): Trzy role AI po zmianie terenu

**Files:** Modify `enemyAI.js`, `simulation.js`, `turns.js`; Create `test/brand-ai.test.js`.

**Interfaces:** `planEnemyAction` z task09; dodatkowo `scoreEnemyAction({role,damage,selfDamage,distanceAfter,opensPath}):number`, `buildWalkGraph(terrain,actorSize):{nodes,edges,revision}` w enemyAI. Próbkowanie dostępnych powierzchni, krawędzie chodzenia/skoku sprawdzone przez shape casts. Cache keyed terrain.revision.

- [ ] Test ról:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreEnemyAction} from '../src/engine/tactical/enemyAI.js';
test('Szturmowiec premiuje podejście, ale nie samobójczy atak',()=>{
 const score=(distanceAfter,selfDamage=0)=>scoreEnemyAction({role:'rusher',damage:0,selfDamage,distanceAfter,opensPath:false});
 assert.ok(score(1)>score(10)); assert.ok(score(1,100)<score(10));
});
```

- [ ] `node --test test/brand-ai.test.js` → RED.
- [ ] Wprowadź skończony zbiór kandydatów: lewo/bez ruchu/prawo, czasy0/.5/1s, kąty i moce grid; użyj wspólnej trajektorii do oceny, limit200 kandydatów. Wzór startowy:

```js
return damage*3 - selfDamage*5 + (opensPath?8:0)
  - distanceAfter*(role==='rusher'?2:.2);
```

- [ ] Shooter używa Jajooki, Grenadier granatu, Rusher podejścia i Kopniaka (Jajooka jako legalny atak otwierający teren). Nie wykonuj ataku przed widocznym telegraphem. Brak kandydata → null → koniec akcji. Dodaj scenariusz ściany usuniętej w trakcie walki i braku legalnej drogi; sprawdź zmianę decyzji/revision, brak stalej pętli.
- [ ] Testy AI/turns PASS, rzeczywista walka przeciw dwóm rolom; commit `feat: make enemy roles react to rebuilt terrain`.

## Task 16 (M2): Szybka potyczka i izolacja od wyprawy

**Files:** Create `src/game/quickBattle.js`, `src/engine/ui/QuickSelect.jsx`, `test/brand-quick.test.js`; Modify `KurczokerCanvas.jsx`, `arena.js`, `BattleHUD.jsx`.

**Interfaces:** `createQuickBattle(mapId,seed):BattleOptions`; `QuickSelect({maps,selectedMapId,onSelect,onStart})`; pełny standardowy inventory ze specyfikacji. Wynik quick jest stanem UI, nie operacją na kampanii.

- [ ] Test:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {createQuickBattle} from '../src/game/quickBattle.js';
test('szybki tryb ma pełny arsenał i niezależne zapasy',()=>{
 const a=createQuickBattle('yard',1),b=createQuickBattle('yard',1);
 assert.equal(a.player.inventory.owned.length,6);
 assert.equal(a.player.inventory.ammo.cluster,1);
 a.player.inventory.tools.drill=0;
 assert.equal(b.player.inventory.tools.drill,2);
});
```

- [ ] `node --test test/brand-quick.test.js` → RED.
- [ ] Zbuduj świeże inventory przy każdym starcie i stabilne encounterId z seed/map. Selektor map ma przyciski o nazwie mapy, `aria-pressed` wybranej i czytelny przekrój. Początek komponentu:

```jsx
{maps.map(map=><button key={map.id} aria-pressed={selectedMapId===map.id}
 onClick={()=>onSelect(map.id)}>{map.name}</button>)}
<button onClick={onStart}>Rozpocznij potyczkę</button>
```

- [ ] Rozwiń browser foundation: dziewięć przycisków, uruchom dwie różne mapy, rewanż z bazowym terenem i zapasem. Zasymulowany istniejący zapis wyprawy pozostaje bajtowo niezmieniony po quick.
- [ ] Test quick i browser PASS; commit `feat: expose instant battles on all nine maps`.

## Task 17 (M3): Czysty przebieg czterech walk wyprawy

**Files:** Create `src/game/expedition.js`, `test/brand-expedition.test.js`; Modify `config.js`.

**Interfaces:** `createExpedition(seed):Expedition`; `chooseRoute(game,routeId):Expedition`; `startEncounter(game):{game,options:BattleOptions}`; `finishEncounter(game,result):Expedition`. Result `{encounterId,outcome,health,inventory,upgrades,battleStart}`. Expedition `{schemaVersion:2,runId,seed,rngState,scene,stage:0..3,health,maxHealth,grain,inventory,upgrades,routes,selectedRouteId,encounterId,battleStart,completedEncounterIds,rewardChoices,offers,secondChanceUsed,status}`; scenes `map|battle|reward|shop|retry|result`, status `active|won|lost`.

- [ ] Test liczby etapów i odrzucenia obcego wyniku:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {createExpedition,startEncounter,finishEncounter} from '../src/game/expedition.js';
test('nowa wyprawa zaczyna się skromnie i ignoruje obcy wynik',()=>{
 const g=createExpedition(7);
 assert.deepEqual(g.inventory.owned,['jajooka','kick']); assert.equal(g.stage,0);
 const started=startEncounter(g);
 const ignored=finishEncounter(started.game,{encounterId:'foreign',outcome:'won',health:100,
 inventory:g.inventory,upgrades:[],battleStart:null});
 assert.deepEqual(ignored,started.game);
});
```

- [ ] `node --test test/brand-expedition.test.js` → RED.
- [ ] Przebieg map/yard→reward→routes→battle→reward→shop→battle→reward→shop→boss→result. `stage` zwiększaj dopiero przy zatwierdzonym przejściu do kolejnej walki, nie przy każdej nagrodzie. Pierwsza trasa wskazuje yard i jest wybrana domyślnie. PRNG z task01 zapisywany w stanie:

```js
import {nextRandom} from '../engine/tactical/config.js';
const roll=nextRandom(game.rngState);
const nextGame={...game,rngState:roll.state};
// Wybór z jawnej listy kandydatów: Math.floor(roll.value*candidates.length).
```

- [ ] Odrzucaj wynik dla niewłaściwej sceny, encounterId już completed lub niezgodnego aktywnego encounter. Przekazuj rzeczywiste HP/inventory do następnej walki. Testuj dokładnie4 encounters, ostatni boss, powtórzony event bez ponownego łupu oraz wybór wyłącznie dostępnej trasy.
- [ ] Test expedition PASS; commit `feat: model the four-encounter expedition flow`.

## Task 18 (M3): Nagrody, ulepszenia i sklep

**Files:** Create `src/game/expeditionRewards.js`, `test/brand-economy.test.js`; Modify `expedition.js`; Create `src/engine/ui/RewardPanel.jsx`, `ShopPanel.jsx`.

**Interfaces:** `rewardChoices(game):Reward[]`, `applyReward(game,rewardId):Expedition`, `shopOffers(game):Offer[]`, `buyOffer(game,offerId):Expedition`, `leaveShop(game):Expedition`. Reward `{id,label,description,kind,weaponId?,amount?}`; Offer dodaje `{price,purchased}`. Ulepszenia ID `shell`,`boots`,`toolbelt`; wartości shell 50% pierwszego trafienia, boots koszt upadku10% zamiast20%, toolbelt +1 obu narzędzi przy zdobyciu.

- [ ] Test realnej oferty i braku ujemnej waluty:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {createExpedition} from '../src/game/expedition.js';
import {shopOffers,buyOffer} from '../src/game/expeditionRewards.js';
test('leczenie jest atomowe, ograniczone do maxHP i nie kupuje się dwukrotnie',()=>{
 let g={...createExpedition(1),scene:'shop',grain:30,health:90};
 g={...g,offers:shopOffers(g)}; const offer=g.offers.find(o=>o.kind==='heal');
 const bought=buyOffer(g,offer.id);
 assert.equal(bought.health,100); assert.equal(bought.grain,10);
 assert.deepEqual(buyOffer(bought,offer.id),bought);
 assert.equal(g.grain,30);
});
```

- [ ] `node --test test/brand-economy.test.js` → RED.
- [ ] Pierwszy łup gwarantuje Granajko3 i wybór narzędzia1. Później trzy różne role nagrody. Zastępuj posiadane unikalne ulepszenie amunicją/lekiem, nowej broni dodaj zapas. Zakup sprawdza ofertę w bieżącym stanie, nie cenę z payloadu:

```js
const offer=game.offers.find(o=>o.id===offerId);
if(game.scene!=='shop'||!offer||offer.purchased||game.grain<offer.price) return game;
const paid={...game,grain:game.grain-offer.price,
 offers:game.offers.map(o=>o.id===offerId?{...o,purchased:true}:o)};
```

- [ ] UI pokazuje stan przed/po i przyczynę blokady. Do runtime dodaj reset osłony na początku encounter i konsumowanie tylko pierwszego faktycznego trafienia; boots działa identycznie po wznowieniu. Testy duplikatów, ammo>0 nowej broni, ponownego kliknięcia i braku pieniędzy PASS.
- [ ] Commit: `feat: add meaningful expedition rewards and purchases`.

## Task 19 (M3): Jajokról z zapowiedziami i finałem

**Files:** Create `src/engine/tactical/boss.js`, `test/brand-boss.test.js`; Modify `enemyAI.js`, `turns.js`, `BattleHUD.jsx`, `simulation.js`; Create `src/engine/ui/ResultPanel.jsx`.

**Interfaces:** `bossIntent({health,maxHealth,actionIndex,canCharge}):{type:'salvo'|'charge',shots:number,label:string}`; snapshot dodaje `boss:{actionIndex,intent}|null`. Intencję ustalaj przed player phase i zachowuj; zablokowana później szarża kończy się na przeszkodzie i ogłasza kolejny zamiar, nie podmienia się skrycie na salwę.

- [ ] Test:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {bossIntent} from '../src/engine/tactical/boss.js';
test('druga faza ma mocniejszą salwę, blokada nie tworzy teleportu',()=>{
 const high=bossIntent({health:140,maxHealth:140,actionIndex:0,canCharge:true});
 const low=bossIntent({health:60,maxHealth:140,actionIndex:0,canCharge:true});
 assert.equal(high.type,'salvo'); assert.ok(low.shots>high.shots);
 assert.equal(bossIntent({health:140,maxHealth:140,actionIndex:1,canCharge:false}).type,'salvo');
});
```

- [ ] `node --test test/brand-boss.test.js` → RED.
- [ ] Wzorzec parzysta akcja salwa2, nieparzysta szarża; low HP salwa3. Szarża ma max8jednostek, shape casts, jedno trafienie na cel. Faza niskiego HP nie leczy i nie wyłącza kolizji. Implementuj intencję:

```js
const charge=actionIndex%2===1 && canCharge;
return charge?{type:'charge',shots:0,label:'Jajokról szykuje szarżę'}:
 {type:'salvo',shots:health<maxHealth/2?3:2,label:'Jajokról szykuje salwę'};
```

- [ ] Rozegraj obie fazy; wynik „Korona spadła” lub „Tym razem kurnik górą”, przyciski nowa wyprawa/szybka potyczka. Testuj szarżę w ścianę zmienioną po zapowiedzi i finał przy jednoczesnej śmierci.
- [ ] Test boss/turns PASS; commit `feat: add readable boss patterns and expedition endings`.

## Task 20 (M3): Checkpoint v2, IndexedDB i druga szansa

**Files:** Modify `checkpoint.js`, `simulation.js`, `expedition.js`; Create `saveStorage.js`, `test/brand-checkpoint.test.js`, `test/visual/brand-storage.test.js`.

**Interfaces:** async `encodeCheckpoint({game,battle,battleStart}):Promise<string>` i `decodeCheckpoint(text):Promise<{ok:true,value}|{ok:false,reason}>`; envelope `{version:2,payload:string,checksum:string}`. `createSaveStorage(indexedDB):Promise<{read(),write(encoded),close()}>`; read zwraca latest/previous; write jedna transakcja. `useSecondChance(game):Expedition` tylko scene retry i niewykorzystana szansa; przywraca battleStart, znacznik true.

- [ ] Test roundtrip i integralności:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeCheckpoint,decodeCheckpoint} from '../src/engine/tactical/checkpoint.js';
import {createExpedition,startEncounter} from '../src/game/expedition.js';
import {createBattleSimulation} from '../src/engine/tactical/simulation.js';
test('checkpoint zachowuje wycięty teren i odrzuca zmianę payloadu',async()=>{
 const game=createExpedition(1); game.inventory.tools.drill=1;
 const started=startEncounter(game);
 const s=await createBattleSimulation(started.options);
 try{const battleStart=s.snapshot();
  assert.equal(s.dispatch({type:'tool',toolId:'drill',direction:1}).accepted,true);
  assert.ok(s.snapshot().terrain.revision>battleStart.terrain.revision);
  const data={game:{...started.game,battleStart},battle:s.snapshot(),battleStart};
  const text=await encodeCheckpoint(data),decoded=await decodeCheckpoint(text);
  assert.equal(decoded.ok,true); assert.deepEqual(decoded.value,data);
  const bad=JSON.parse(text);bad.payload+=' ';
  assert.equal((await decodeCheckpoint(JSON.stringify(bad))).ok,false);
 }finally{s.dispose();}
});
```

- [ ] `node --test test/brand-checkpoint.test.js` → RED.
- [ ] Hash SHA-256 przez `crypto.subtle` Web/Node, checksum integralności bez obietnicy antycheat. Waliduj schemat, znane ID map/weapon/role, zakresy liczb, długość maski, max8MiB tekstu, brak duplikatów actorID. Nie zapisuj collider handles. `restoreBattleSimulation` odbudowuje maskę/kolizje/postacie/miny/prędkości/rope/PRNG, nie losuje mapy od nowa.

```js
const bytes=new TextEncoder().encode(payload);
const digest=await crypto.subtle.digest('SHA-256',bytes);
const checksum=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
```

- [ ] IndexedDB `kurczoker-v2`, store `saves`, keys latest/previous. W jednej transakcji read latest→put previous→put new latest; czekaj na transaction.complete, nie tylko request.success. Test browser: write/read/abort, quota failure pokazuje błąd, latest pozostaje poprawny. Stary localStorage zachowaj jako kopię i pokaż wiadomość o nowej wyprawie, nie kasuj automatycznie.
- [ ] Druga szansa: zbuduj stan z battleStart + secondChanceUsed=true, zapisz razem, potem oddaj sterowanie. Przy write failure gracz może grać w pamięci z ostrzeżeniem; nie udawaj trwałego zapisu. Dodaj test ponowienia dwa razy oraz restore i dokładności lotu po zapisanej prędkości.
- [ ] Test checkpoint + browser storage PASS; commit `feat: persist terrain and retry state atomically`.

## Task 21 (M3): Integracja kampanii, zapisów i ekranów

**Files:** Modify `store/useGameStore.js`, `KurczokerCanvas.jsx`, `GameRuntime.jsx`, `scenes/MapScene.jsx`, `src/pages/gra.astro`; Create `src/engine/ui/ExpeditionMap.jsx`, `test/brand-campaign-bridge.test.js`, `test/visual/brand-expedition.test.js`.

**Interfaces:** store exports `createBrandStore(seed,{storage}={})` dla testu i hook aktywnej aplikacji. Stan `{mode,game,quick,saving,saveError}`; akcje `startExpedition(seed)`, `selectRoute(id)`, `enterEncounter()`, `finishEncounter(result)`, `chooseReward(id)`, `buy(id)`, `leaveShop()`, async `retryEncounter()`, async `resume()`, `startQuick(mapId,seed)`. Kontrakt storage wstrzykiwany jako `{read,write}` do testów; UI wykonuje jedną akcję, nie dwa reducery.

- [ ] Test mostu i izolacji:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {createBrandStore} from '../src/engine/store/useGameStore.js';
test('przejście do quick nie zmienia aktywnej wyprawy',()=>{
 const store=createBrandStore(1);
 store.getState().startExpedition(1);
 const saved=structuredClone(store.getState().game);
 store.getState().startQuick('caves',2);
 assert.equal(store.getState().mode,'quick');
 assert.deepEqual(store.getState().game,saved);
});
```

- [ ] `node --test test/brand-campaign-bridge.test.js` → RED.
- [ ] Odepnij aktywną ścieżkę od `updateBattle`, `tickBattle` i syntetycznego projectileHitEnemy. Wynik trafia tylko z runtime:

```js
finishEncounter(result){
 const before=get().game;
 const next=finishExpeditionEncounter(before,result);
 if(next!==before) set({game:next});
}
// import {finishEncounter as finishExpeditionEncounter} from '../../game/expedition.js'
```

- [ ] Zainstaluj lifecycle: anulowanie async inicjalizacji zwalnia nieużywany world, jeden advance i jeden listener, zapis player phase przed decyzją. Menu pokazuje Wznów przy poprawnym checkpoint. Nowa wyprawa pyta tylko o nadpisanie istniejącego postępu.
- [ ] Browser test przechodzi przez prawdziwe UI mapy→battle→reward→shop→boss→result; osobny defeat→retry→defeat. Seed testowy może stabilizować mapy/nagrody, nie wolno dopisywać HP/wyniku do store, żeby „wygrać”. Odśwież przed drugim strzałem, porównaj widoczny teren/zapas.
- [ ] Testy campaign/expedition/checkpoint + browser PASS; commit `feat: connect expedition screens to the authoritative runtime`.

## Task 22 (M4): Docelowe modele, animacje i budżet renderingu

**Files:** Modify `tools/build-game-assets.mjs`, `tools/prepare-release.mjs`, `test/asset-manifest.test.js`, `releaseManifest.json`, `Chicken.jsx`, `World.jsx`, `Effects.jsx`; Create `assets.js`, `test/brand-assets.test.js`; Generated `public/game/release/*` z nazwami hashowanymi.

**Interfaces:** manifest v2 `{schemaVersion:2,assets:[{id,url,bytes,sha256,kind,clips,provenance}],decoders:{meshopt,ktx2}}`; `loadGameAssets({renderer,manifest,onProgress}):Promise<{models,dispose}>`. `Chicken({sim,actorId,quality})` wybiera po actorId, nie stałym `side=enemy`.

- [ ] Test manifestu rzeczywistych assetów:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
test('bohater ma komplet animacji i poprawny plik runtime',async()=>{
 const m=JSON.parse(await readFile('src/engine/tactical/releaseManifest.json','utf8'));
 const hero=m.assets.find(a=>a.id==='hero');
 for(const clip of ['Idle','Walk','Jump','Swing','Land','Attack','Hit','Defeat']) assert.ok(hero.clips.includes(clip));
 assert.equal((await stat('public'+hero.url)).size,hero.bytes);
 assert.ok(hero.bytes<25*1024**2);
});
```

- [ ] `node --test test/brand-assets.test.js` → RED.
- [ ] Rozwiń istniejący pipeline autora modeli: sylwetka kurczaka, hełm, skrzydła, sprzęt; różne role i boss z koroną. Utwórz wymienione clipy, wyeksportuj glTF; sprawdzaj clipy również z GLB, nie tylko listę w JSON. W tym samym zadaniu przenieś wszystkie czytniki manifestu z `Object.values(manifest)` na `manifest.assets`, zachowując pliki dekoderów w allowliście release. Meshopt configure loader, KTX2 tylko dla faktycznych tekstur Basis i sprawdź detectSupport:

```js
loader.setMeshoptDecoder(MeshoptDecoder);
const ktx2=new KTX2Loader().setTranscoderPath('/game/decoders/');
ktx2.detectSupport(renderer); loader.setKTX2Loader(ktx2);
```

- [ ] Porównaj niższy render target vs RenderPixelatedPass, wybierz czytelniejszy przy zachowanym budżecie; nie pikselizuj HTML HUD. Auto/low/high ograniczają cienie, DPR i cząstki. Użyj instancji drzew/dekoracji, zasobów współdzielonych i dispose po zmianie map.
- [ ] Obejrzyj wszystkie clipy oraz sześć broni na desktop/phone viewport, mierząc frame time. Brak assetu daje retry i jasny błąd; uszkodzenie dekodera nie zostawia czarnego ekranu. Test assets + build PASS; commit `feat: deliver animated retro-styled 3d game assets`.

## Task 23 (M4): Ustawienia, audio, pomoc i dostępność

**Files:** Create `settings.js`, `src/engine/ui/SettingsPanel.jsx`, `test/brand-settings.test.js`; Modify `src/game/audio.js`, `Controls.jsx`, `BattleHUD.jsx`, `KurczokerCanvas.jsx`, `src/styles/game.css`.

**Interfaces:** `normalizeSettings(raw):Settings`, Settings `{hudScale:1|1.25,leftHanded:boolean,musicVolume:0..1,effectsVolume:0..1,shake:boolean,reducedMotion:boolean,quality:'auto'|'low'|'high'}`; audio `setVolumes(audio,{music,effects})`, `pauseAudio(audio,bool)`. Zachowaj istniejące createAudioController i playEffect, rozdziel musicGain/effectsGain.

- [ ] Test:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSettings} from '../src/engine/tactical/settings.js';
test('błędne preferencje nie psują HUD i głośności',()=>{
 const s=normalizeSettings({musicVolume:4,effectsVolume:-1,hudScale:99,quality:'ultra'});
 assert.equal(s.musicVolume,1);assert.equal(s.effectsVolume,0);
 assert.equal(s.hudScale,1);assert.equal(s.quality,'auto');
});
```

- [ ] `node --test test/brand-settings.test.js` → RED.
- [ ] Normalizuj przez jawną allowlistę; respektuj reduced-motion przy pierwszym starcie. Kontrolki głośności:

```js
audio.musicGain.gain.setValueAtTime(settings.musicVolume,audio.context.currentTime);
audio.effectsGain.gain.setValueAtTime(settings.effectsVolume,audio.context.currentTime);
```

- [ ] Dodaj oryginalny prosty motyw retro i odgłosy skoku/liny/ataku; odblokowanie po interakcji, nie na załadowaniu strony. Deduplikuj event.id, nie odtwarzaj zaległych zdarzeń po pauzie. Brak AudioContext nie blokuje gry.
- [ ] Pomoc: wskazówki po jednej na pierwszą czynność, możliwość pominięcia i powrotu. UI: duży HUD, lustrzane sterowanie, etykiety i fokus, suwaki klawiaturą, bez informacji wyłącznie kolorem/dźwiękiem. Browser test zapisuje ustawienia→reload→potwierdza i sprawdza wyłączenie shake.
- [ ] Test settings, kontrola wizualna i keyboard menu PASS; commit `feat: add accessible controls settings and reactive audio`.

## Task 24 (M4): Landing DELTA240MVT i bezpośrednie wejścia

**Files:** Create `src/components/KurczokerLanding.astro`, `src/styles/kurczoker-brand.css`, `test/visual/brand-landing.test.js`; Modify `src/pages/index.astro`, `gra.astro`, `polityka-prywatnosci.astro`.

**Interfaces:** CTA `/gra?mode=quick` oraz `/gra?mode=expedition`; link wznowienia czyta tylko dostępność zapisu przez lekki moduł storage, nie ładuje Rapiera/Three. Rzeczywisty krótki klip z builda zapisany w `public/game/release/` i manifest, fallback obraz bez autoplay audio.

- [ ] Browser test widocznych ścieżek:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {serveBuild} from './server.js';
test('landing prowadzi od razu do dwóch trybów',async()=>{
 const host=process.env.KURCZOKER_VISUAL_BASE_URL
  ?{url:process.env.KURCZOKER_VISUAL_BASE_URL,close:async()=>{}}:await serveBuild();
 const browser=await chromium.launch();
 try{const page=await browser.newPage();await page.goto(host.url);
  assert.equal(await page.getByRole('link',{name:'Szybka potyczka',exact:true}).first().getAttribute('href'),'/gra?mode=quick');
  await page.getByRole('link',{name:'Wyprawa · 10–15 min',exact:true}).first().click();
  assert.equal(new URL(page.url()).searchParams.get('mode'),'expedition');
 }finally{await browser.close();await host.close();}
});
```

- [ ] Build + `node --test test/visual/brand-landing.test.js` → RED.
- [ ] Zbuduj hero z zaakceptowanym copy i typografią:

```astro
<section class="brand-hero" aria-labelledby="game-title">
 <p>KURCZOKER / gra od DELTA240MVT</p>
 <h1 id="game-title">Mała przerwa. Wielka rozróba w kurniku.</h1>
 <p>Wskocz na dach, rozhuśtaj lasso i poślij jajobombę za osłonę.
 Jedna potyczka albo wyprawa na 10–15 minut. Grasz we własnym tempie.</p>
 <a href="/gra?mode=quick">Szybka potyczka</a>
 <a href="/gra?mode=expedition">Wyprawa · 10–15 min</a>
</section>
```

- [ ] Dalej prawdziwa demonstracja, krótkie zasady,9map, autor/link do projektów, FAQ i polityka opisująca faktyczny lokalny zapis. Korzystaj z materiałów marki i wzorców sprzedażowych, bez fikcyjnych opinii i nowej analityki. W hero nie montuj pełnego `KurczokerCanvas`.
- [ ] Sprawdź brand tokens ze specyfikacji, overflow360px, keyboard/tab, czytelny tekst, brak assetów silnika w waterfall przed kliknięciem gry. Browser landing PASS; commit `feat: rebuild the landing around the Delta240MVT brand`.

## Task 25 (M4/M5): Całościowa regresja, pomiary i poprawki

**Files:** Create `test/visual/brand-release.test.js`, `tools/measure-game-transfer.mjs`; Modify `test/visual/profile.mjs`, `test/visual/server.js`, `tools/prepare-release.mjs`, `test/asset-manifest.test.js`; Update `docs/qa/2026-09-08-kurczoker-brand-redesign.md` i testy starego zachowania faktycznie objęte migracją.

**Interfaces:** `measureGameTransfer(url):Promise<{encodedBytes,requests,errors}>` w tools/measure-game-transfer.mjs; CLI bierze jawny argument URL. Raport zawiera środowisko, viewport/device, build/commit, scenariusz i PASS/FAIL z dowodem.

- [ ] Dodaj test awarii assetu do suite browser (w teście dostępne page/base z istniejącej konfiguracji):

```js
await page.route('**/*.glb',route=>route.abort());
await page.goto(base+'/gra?mode=quick');
await page.getByRole('button',{name:'Rozpocznij potyczkę',exact:true}).click();
await page.getByRole('alert').waitFor();
await page.unroute('**/*.glb');
await page.getByRole('button',{name:'Spróbuj ponownie',exact:true}).click();
await page.getByRole('button',{name:'Skok',exact:true}).waitFor();
```

- [ ] Uruchom `node --test test/visual/brand-release.test.js`; brak obsługi retry musi dać RED. Napraw rzeczywistą przyczynę i ponów dotknięty scenariusz.
- [ ] Rozszerz QA o dziewięć map,6broni, wszystkie narzędzia/AI, oba zakończenia, pauzę w wybuchu, zapis, drugą szansę, popup menu i obrót w linie. Przejdź w Codex browser desktop1440×900, pion390×844 i360×800, poziom844×390. Zapisuj screenshots i błędy, a nie tylko narrację.
- [ ] Pomiary transferu używają CDP Network.loadingFinished `encodedDataLength`, bez cache, wejście do pierwszej walki; nie sumują niezaładowanych map. Raport jawnie wskazuje, że lokalny prosty server może nie kompresować i wynik produkcyjny mierzy się na preview. Budżet pojedynczego pliku licz z `stat`, oddziel od celu10MiB transferu.

```js
const client=await page.context().newCDPSession(page);
await client.send('Network.enable');
await client.send('Network.setCacheDisabled',{cacheDisabled:true});
let encodedBytes=0;
client.on('Network.loadingFinished',e=>{encodedBytes+=e.encodedDataLength;});
```

- [ ] Zmierz frame time p95, start i wybuch kasetowy na realnym Androidzie i iPhonie; wpisz model/przeglądarkę/profil. Brak urządzenia odnotuj jako niewykonany test, kończ pozostałe dostępne prace. Trzy ukończone wyprawy osoby znającej sterowanie: zmierz czas i popraw HP/tempoAI, bez zegara decyzji. Profile jakości nie zmieniają wyniku symulacji.
- [ ] `npm test`, `npm run build`, `npm run test:visual`, `git diff --check` → PASS. Nowe błędy naprawiaj z testem przyczyny; nie usuwaj testu tylko z powodu FAIL. Commit `test: verify the complete redesign and release budgets`.

## Task 26 (M5): Preview, commit/push i produkcja sprawdzonego buildu

**Files:** Create `tools/deploy-target.mjs`; Modify `tools/deploy-pages.mjs`, `tools/prepare-release.mjs`, `public/_headers`, `test/deploy-script.test.js`; Update raport QA i ten plan. Read `tools/pages.config.json`; nie wypisuj `.env`, tokenów ani kont użytkownika.

**Interfaces:** `release-report.json` dodaje `sourceCommit`, `dirty`, `files:[{path,sha256,bytes}]` oraz wynik kontroli limitu25MiB. Hash listy nie obejmuje samego raportu. `deploy-pages.mjs --branch <branch>` publikuje preview, `--branch main --production` produkcję; script odrzuca produkcję bez jawnego flag i bez zgodnego manifestu.

- [ ] Test deploy-script rozszerz o rozdzielenie ścieżek i zweryfikuj RED przed zmianą. Pure helper `deploymentTarget({branch,production,config}):{branch,project}` eksportuj z nowego `tools/deploy-target.mjs` i importuj w skrypcie; test nie wysyła nic do Cloudflare:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {deploymentTarget} from '../tools/deploy-target.mjs';
test('main wymaga jawnego wskazania produkcji',()=>{
 const config={projectName:'kurczoker-makeover',productionBranch:'main'};
 assert.throws(()=>deploymentTarget({branch:'main',production:false,config}));
 assert.deepEqual(deploymentTarget({branch:'baza080926-makeover',production:false,config}),
  {branch:'baza080926-makeover',project:'kurczoker-makeover'});
});
```

- [ ] Dodaj poprawne MIME/cache, hashowane assety immutable, HTML/manifest rewalidowane. Manifest generuj SHA-256 dla plików dist. Nie przypisuj repo commit bez sprawdzenia dirty state; nie stosuj stale `--commit-dirty=true` do finalnego czystego wydania.
- [ ] Test deploy PASS, build, kontrola wszystkich plików25MiB. Wykonaj jawnie:

```powershell
node tools/deploy-pages.mjs --branch baza080926-makeover
```

- [ ] Zapisz zwrócony immutable preview URL; uruchom browser suite przeciw temu URL (testy muszą honorować istniejące `KURCZOKER_VISUAL_BASE_URL`) i przejdź oba tryby w Codexie. Sprawdź HTTPS, load models/decoder/audio, odświeżenie i checkpoint. Mierz transfer. Jeśli poprawka zmienia build, powtórz dotknięty odbiór na nowym preview.
- [ ] Zapisz raport, commit `release: approve the tested Kurczoker redesign`; sprawdź clean tree i push gałęzi. Odczytaj aktualny remote main przed integracją:

```powershell
git fetch origin
git log --oneline origin/main..HEAD
git log --oneline HEAD..origin/main
git push origin baza080926-makeover
```

- [ ] Jeśli main jest przodkiem zatwierdzonego HEAD, fast-forward `git push origin HEAD:main` realizuje wcześniejsze zlecenie bez zmiany worktree. Jeśli main ma cudze zmiany, zintegruj je na bieżącej gałęzi bez force, rozwiąż konflikty i ponów odpowiednie testy/preview. Nie publikuj nieprzetestowanego merge'a.
- [ ] Produkcja: zachowaj niezmienione pliki dist sprawdzonego preview; porównaj hash listy. Jeśli build zawiera nowy hash commita i trzeba go odtworzyć, najpierw opublikuj nowy preview i sprawdź go. Następnie:

```powershell
node tools/deploy-pages.mjs --branch main --production
```

- [ ] Potwierdź zwrócony production URL, połączenie domeny z projektem i krótką grę kontrolną. Zapisz commit, URL preview i produkcji oraz poprzedni deployment do rollbacku. Przy błędzie auth/domeny wykonaj wszystkie lokalne kroki i podaj konkretny brak dostępu; nie twierdź, że opublikowano. Nie pytaj ponownie o już zlecony push/deploy.

## Mapa pokrycia specyfikacji

| Sekcje specyfikacji | Zadania planu |
|---|---|
| 1–2 Cel i reguły | Global Constraints; 03,05,08,09,12,16,17,24 |
| 3 Ekrany i ścieżki | 12,16,18,19,21,24 |
| 4 Szybka potyczka | 14,16,21 |
| 5 Dziewięć map | 01,02,14,25 |
| 6 Tury | 07,08,09,13,15,19 |
| 7 Ruch/lina/upadki | 03,04,05,06,10,11 |
| 8 Arsenał i destrukcja | 01,02,07,08,13 |
| 9 Balans | config w01/13,18,19 i pomiary25 |
| 10 AI i boss | 09,15,19 |
| 11 Wyprawa/ekonomia | 17,18,21 |
| 12 Porażka i finały | 09,19,20,21 |
| 13 Zapis | 20,21,25 |
| 14–15 Sterowanie/dostępność/audio | 10,11,12,23,25 |
| 16 Modele i marka | 12,22,23,24 |
| 17 Landing/fabuła | 19,24 |
| 18–19 Architektura/migracja | mapa plików, kontrakty,01–12,20–22 |
| 20 Cloudflare/ładowanie | 12,22,24,25,26 |
| 21–23 Etapy/odbiór/ryzyka | wszystkie etapy,25,26 |
| 24 Źródła | zatwierdzony spec i research, lokalne API sprawdzane przy użyciu |

## Samoprzegląd i przekazanie do wykonania

- Nazwy komend, weaponId, mapId i schemaVersion są wspólne; UI nie przywraca starego limitu20s ani sterowania Space=strzał.
- `terrain.snapshot()` i boxy task02 są jedynym źródłem renderera oraz kolizji; nie ma dodatkowej niewidzialnej mapy dla AI.
- Task12 kończy się kompletną areną; task16 kompletnym szybkim trybem; task21 pełną wyprawą; task26 wydaniem. Żaden z wcześniejszych etapów nie zamyka całego zlecenia.
- Wykonanie jest inline, zgodnie z już wybranym trybem. Po zapisaniu planu kolejnym skillem jest `executing-plans`; nie tworzymy nowego zadania ani worktree.
- Na moment sporządzenia planu żaden checkbox implementacji nie oznacza wykonanego kodu lub testu. Checkboxy uzupełniać dowodami, a raport QA prowadzić od baseline.
