// Loads the real game (lang/*.js + the inline game <script> in index.html)
// into a node:vm context with a minimal fake browser. No dependencies.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DT = 1 / 60;

// Anything-goes stand-in for a 2D canvas context: every property is a no-op
// function that returns the context again (so gradients etc. chain).
function fakeCtx(){
  const fn = new Proxy(function(){}, {
    get: (t, k) => k === Symbol.toPrimitive ? () => 0 : fn,
    set: () => true,
    apply: () => fn,
  });
  return fn;
}

function fakeElement(tag = 'div'){
  const classes = new Set();
  return {
    tagName: tag.toUpperCase(),
    textContent: '', innerHTML: '', className: '',
    style: {}, dataset: {}, children: [],
    width: 0, height: 0,
    classList: {
      add: (...c) => c.forEach(x => classes.add(x)),
      remove: (...c) => c.forEach(x => classes.delete(x)),
      toggle(c, on = !classes.has(c)){ on ? classes.add(c) : classes.delete(c); return on; },
      contains: c => classes.has(c),
    },
    appendChild(ch){ this.children.push(ch); return ch; },
    addEventListener(){}, removeEventListener(){},
    querySelector: () => null, querySelectorAll: () => [],
    getContext: () => fakeCtx(),
    getBoundingClientRect: () => ({ left:0, top:0, width:960, height:520 }),
  };
}

// Small deterministic PRNG so city layout / boxes don't vary between runs.
function mulberry32(a){
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Load a fresh game. Returns { window, hook, G, step, ... }.
 * opts.testFlag (default true) sets window.__TSUNAMI_TEST__ = { noLose } before the script runs.
 * opts.noLose disables the home-flooded lose check (for balance runs with no defences).
 * opts.lang sets the saved language in localStorage (default 'en').
 * opts.seed seeds Math.random (city layout, boxes) so runs are repeatable.
 */
export function loadGame({ testFlag = true, noLose = false, lang = 'en', seed = 1 } = {}){
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const langSrcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
  const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  if(inline.length !== 1) throw new Error(`expected one inline <script> in index.html, found ${inline.length}`);

  const els = new Map();
  const store = new Map(lang ? [['tsunami.lang', lang]] : []);
  const document = {
    documentElement: { lang: '' }, title: '', hidden: false,
    getElementById(id){ if(!els.has(id)) els.set(id, fakeElement()); return els.get(id); },
    createElement: tag => fakeElement(tag),
    querySelector: () => null, querySelectorAll: () => [],
    addEventListener(){},
  };
  const ctx = {
    document,
    localStorage: {
      getItem: k => store.has(k) ? store.get(k) : null,
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k),
    },
    requestAnimationFrame: () => 0, // never drive the real loop; the test steps update()
    performance: { now: () => 0 },
    setTimeout: () => 0, clearTimeout(){},  // endGame()/toast timers are not needed
    innerWidth: 980, innerHeight: 540,
    addEventListener(){},
    console,
  };
  ctx.window = ctx;
  if(testFlag) ctx.__TSUNAMI_TEST__ = { noLose };
  vm.createContext(ctx);
  vm.runInContext('Math', ctx).random = mulberry32(seed);

  for(const src of langSrcs)
    vm.runInContext(readFileSync(join(ROOT, src), 'utf8'), ctx, { filename: src });
  vm.runInContext(inline[0][1], ctx, { filename: 'index.html<script>' });

  const hook = ctx.__tsunami;
  return { window: ctx, document, hook, G: hook && hook.G };
}

/**
 * Count water added to G.water by indexed writes while phase === 'tsunami'.
 * Only the right-edge inflow raises a cell by indexed write: the flow step
 * builds a new array and assigns it whole, and decay/towers only lower cells.
 * Returns an object keyed by G.wave (0-based) with the summed inflow.
 */
export function watchInflow(G){
  const byWave = {};
  const wrap = arr => new Proxy(arr, {
    get(t, k){ const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; },
    set(t, k, v){
      const before = t[k];
      t[k] = v;
      const d = t[k] - before;  // measured after Float32 rounding
      if(d > 0 && G.phase === 'tsunami') byWave[G.wave] = (byWave[G.wave] || 0) + d;
      return true;
    },
  });
  let cur = wrap(G.water);
  Object.defineProperty(G, 'water', {
    get: () => cur,
    set: a => { cur = wrap(a); },
    enumerable: true, configurable: true,
  });
  return byWave;
}

/**
 * Play every wave with no structures, stepping update(dt) (default DT).
 * Load the game with { noLose: true } so a flooded home doesn't end the run.
 * Returns [{ wave, inflow, peakHome }] per wave (wave is 1-based).
 */
export function playAllWaves(game, { maxSeconds = 1200, dt = DT } = {}){
  const { hook, G } = game;
  const { HOME, COLS } = hook;
  hook.startGame();
  const inflow = watchInflow(G);
  const peak = {};
  for(let t = 0; t < maxSeconds && G.phase !== 'win' && G.phase !== 'lose'; t += dt){
    hook.update(dt);
    if(G.phase === 'tsunami' || G.phase === 'drain'){
      for(let x = HOME.x; x < HOME.x + HOME.w; x++)
        for(let y = HOME.y; y < HOME.y + HOME.h; y++)
          peak[G.wave] = Math.max(peak[G.wave] || 0, G.water[y * COLS + x]);
    }
  }
  if(G.phase !== 'win') throw new Error(`game did not finish: phase=${G.phase} wave=${G.wave + 1}`);
  return hook.WAVES.map((_, w) => ({ wave: w + 1, inflow: inflow[w] || 0, peakHome: peak[w] || 0 }));
}
