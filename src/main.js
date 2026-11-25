import './styles.css';
import { SHELF, BOOKS, AUTHORS, MOODS, hourOf, clockOf } from './library.js';
import { nightAt, START_HOUR, IS_DAYTIME } from './night.js';
import * as V from './views.js';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const ui = document.getElementById('ui');
const veil = document.getElementById('veil');

const S = {
  route: 'shelf', param: null,
  hour: START_HOUR, hourTarget: START_HOUR,
  mood: 'all', focus: null, at: -1,
  shelf: { carto: true, salt: true, weight: true }, follows: {}, notify: {}, extra: {}, dig: {},
  hall: 'Authors', lumen: false, ask: null, askPh: 'idle', seal: 0, letter: 0,
  dayNote: IS_DAYTIME ? 'IT’S DAYTIME · THE LIBRARY OPENS AT DUSK · HERE’S TONIGHT' : 'OPEN NOW · 1,204 READERS AWAKE',
};

const list = () => SHELF.filter((b) => S.mood === 'all' || b.mood.includes(S.mood));
// start on the book whose hour is closest to now
S.focus = SHELF.reduce((best, b) => (Math.abs(hourOf(b.hour) - S.hour) < Math.abs(hourOf(best.hour) - S.hour) ? b : best), SHELF[0]).id;

let G = null; // { stage, shelf, reader }

/* ------------------------------------------------------------------ light & theme */
let lastName = '';
function light(force) {
  const n = nightAt(S.hour);
  const root = document.documentElement;
  for (const [k, v] of Object.entries(n.css)) root.style.setProperty(k, v);
  root.dataset.light = n.light ? 'day' : 'night';
  if (G) { G.stage.setNight(n); G.reader.setNight(n); }
  const c = ui.querySelector('.clock');
  if (c) {
    c.querySelector('b').textContent = clockOf(S.hour);
    c.querySelector('.clock-d').style.setProperty('--a', ((S.hour - 18) / 12) * 180 + 'deg');
    if (n.name !== lastName || force) { c.querySelector('span:last-child').textContent = n.name; lastName = n.name; }
  }
  const head = ui.querySelector('.dial-head');
  if (head) { head.style.left = ((S.hour - 18) / 12) * 100 + '%'; head.querySelector('em').textContent = clockOf(S.hour); }
}

/* ------------------------------------------------------------------ render */
function render() {
  const n = nightAt(S.hour);
  let view = '';
  const b = BOOKS[S.param];
  if (S.route === 'shelf') { const L = list(); const f = L.find((x) => x.id === S.focus) || L[0]; S.focus = f.id; view = V.shelfView(S, L, f); }
  else if (S.route === 'book' && b) view = V.bookView(S, b, S.at, G ? G.reader.hours || [] : spreadHoursFallback(b));
  else if (S.route === 'authors') view = V.authorsView(S);
  else if (S.route === 'author') view = V.authorView(S, AUTHORS[S.param] ? S.param : 'mira');
  else if (S.route === 'rooms') view = V.roomsView(S, S.param);
  else if (S.route === 'lanterns') view = V.lanternsView(S);
  else if (S.route === 'desk') view = V.deskView(S);
  const scroll = ui.querySelector('.scroller')?.scrollTop || 0;
  ui.innerHTML = V.chrome(S, n) + `<main class="scroller r-${S.route}" id="main">${view}</main>`;
  ui.dataset.route = S.route;
  if (S._keepScroll) ui.querySelector('.scroller').scrollTop = scroll;
  S._keepScroll = false;
  light(true);
}

function spreadHoursFallback(b) { const h = hourOf(b.hour); return [h, h + 0.85, h + 2.1, h + 3.6, 29.83]; }

/* ------------------------------------------------------------------ routing */
function parse() {
  const [, r = '', p = null] = location.hash.replace(/^#/, '').split('/');
  const map = { '': 'shelf', book: 'book', authors: 'authors', author: 'author', rooms: 'rooms', lanterns: 'lanterns', desk: 'desk' };
  return { route: map[r] || 'shelf', param: p };
}

async function navigate() {
  const { route, param } = parse();
  const prev = S.route;
  S.lumen = false;
  if (route === 'book') {
    const b = BOOKS[param];
    if (!b) { location.hash = '#/'; return; }
    S.focus = b.id;
    if (G) await toReader(b, prev === 'shelf');
    S.route = route; S.param = param; S.at = -1;
    S.hourTarget = hourOf(b.hour);
    render();
    if (G && !reduced()) setTimeout(() => { if (S.route === 'book' && G.reader.at < 0) G.reader.go(1); }, 900);
    return;
  }
  if (prev === 'book' && G) await veilSwap();
  S.route = route; S.param = param;
  if (G) { G.shelf.leave = 0; G.reader.group.visible = false; }
  render();
  ui.querySelector('.scroller')?.scrollTo(0, 0);
  syncShelf();
}

function veilSwap() {
  if (reduced()) return Promise.resolve();
  veil.classList.add('on');
  return new Promise((r) => setTimeout(r, 380)).then(() => { requestAnimationFrame(() => veil.classList.remove('on')); });
}

async function toReader(b, fromShelf) {
  if (fromShelf && !reduced()) {
    G.shelf.focusId(b.id);
    const t0 = performance.now();
    await new Promise((r) => { const step = (t) => { const p = Math.min(1, (t - t0) / 650); G.shelf.leave = p * p; if (p < 1) requestAnimationFrame(step); else r(); }; requestAnimationFrame(step); });
  }
  await veilSwap();
  G.reader.load(b);
  G.reader.group.visible = true;
  G.shelf.visible = 0;
  G.shelf.leave = 0;
  G.camSnap = true;
}

/* ------------------------------------------------------------------ shelf sync */
function setFocus(id, { hour = true } = {}) {
  if (S.focus === id) return;
  S.focus = id;
  if (hour) S.hourTarget = hourOf(BOOKS[id].hour);
  syncShelf();
  if (S.route === 'shelf') render();
}

function syncShelf() {
  if (!G) return;
  const L = list();
  G.shelf.filter(L.map((b) => b.id));
  const i = L.findIndex((b) => b.id === S.focus);
  G.shelf.target = i < 0 ? 0 : i;
  if (i < 0 && L[0]) S.focus = L[0].id;
}

/* ------------------------------------------------------------------ interactions */
ui.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.tagName === 'FORM') return;
  const a = el.dataset.act;
  const L = list();
  const i = L.findIndex((b) => b.id === S.focus);
  if (a === 'mood') { S.mood = el.dataset.k; const L2 = list(); if (!L2.find((b) => b.id === S.focus)) S.focus = L2[0].id; S.hourTarget = hourOf(BOOKS[S.focus].hour); syncShelf(); render(); }
  else if (a === 'prev' && i > 0) setFocus(L[i - 1].id);
  else if (a === 'next' && i < L.length - 1) setFocus(L[i + 1].id);
  else if (a === 'open') location.hash = `#/book/${el.dataset.id}`;
  else if (a === 'shelve') { S.shelf[el.dataset.id] = !S.shelf[el.dataset.id]; render(); }
  else if (a === 'pnext') G ? G.reader.go(1) : null;
  else if (a === 'pprev') G ? G.reader.go(-1) : null;
  else if (a === 'goto') gotoSpread(+el.dataset.i);
  else if (a === 'lumen') { S.lumen = !S.lumen; render(); }
  else if (a === 'ask') { S.ask = +el.dataset.i; S.askPh = 'thinking'; render(); clearTimeout(S._askT); S._askT = setTimeout(() => { S.askPh = 'done'; if (S.lumen) render(); }, reduced() ? 0 : 1000); }
  else if (a === 'showbook') { S.mood = 'all'; S.lumen = false; S.focus = null; if (S.route !== 'shelf') location.hash = '#/'; setTimeout(() => setFocus(el.dataset.id), 50); render(); }
  else if (a === 'follow') { S.follows[el.dataset.k] = !S.follows[el.dataset.k]; S._keepScroll = true; render(); }
  else if (a === 'notify') { S.notify[el.dataset.k] = !S.notify[el.dataset.k]; S._keepScroll = true; render(); }
  else if (a === 'letter') { S.letter++; S._keepScroll = true; render(); }
  else if (a === 'hall') { S.hall = el.dataset.k; render(); }
  else if (a === 'seal') { S.seal = +el.dataset.i; S._keepScroll = true; render(); }
  else if (a === 'digest') { const id = el.dataset.id; S.dig[id] = 'thinking'; S._keepScroll = true; render(); setTimeout(() => { S.dig[id] = 'done'; if (S.route === 'rooms') { S._keepScroll = true; render(); } }, reduced() ? 0 : 1100); }
  else if (a === 'clock') { S.hourTarget = S.hour + 1 > 30 ? 18 : S.hour + 1; }
});

ui.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-act="say"]');
  if (!f) return;
  e.preventDefault();
  const t = f.elements.t.value.trim();
  if (!t) return;
  const id = f.dataset.id;
  (S.extra[id] ||= []).push({ who: 'Aanya Rao', i: 'A', c: '#FFB86B', tag: 'YOU', text: t });
  S._keepScroll = true;
  render();
  const m = ui.querySelector('.msgs'); if (m) m.scrollTop = m.scrollHeight;
  ui.querySelector('#sayIn')?.focus();
});

function gotoSpread(target) {
  if (!G) return;
  const r = G.reader;
  const step = () => { if (S.route !== 'book') return; if (r.flip) return setTimeout(step, 80); if (r.at === target) return; r.go(target > r.at ? 1 : -1); setTimeout(step, 120); };
  step();
}

// the night dial (scrub the hour)
let dialDrag = false;
function dialAt(e) {
  const d = ui.querySelector('[data-dial] .dial-track');
  if (!d) return;
  const r = d.getBoundingClientRect();
  const h = 18 + Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * 12;
  S.hourTarget = h; if (reduced()) S.hour = h;
  const L = list();
  const near = L.reduce((best, b) => (Math.abs(hourOf(b.hour) - h) < Math.abs(hourOf(best.hour) - h) ? b : best), L[0]);
  if (near.id !== S.focus) { S.focus = near.id; syncShelf(); const keep = S.hourTarget; render(); S.hourTarget = keep; }
}
ui.addEventListener('pointerdown', (e) => { if (e.target.closest('[data-dial]')) { dialDrag = true; dialAt(e); e.preventDefault(); } });
addEventListener('pointermove', (e) => { if (dialDrag) dialAt(e); });
addEventListener('pointerup', () => { if (dialDrag) { dialDrag = false; S.hourTarget = hourOf(BOOKS[S.focus].hour); } });

addEventListener('keydown', (e) => {
  if (e.target.closest?.('input,textarea')) return;
  if (e.key === 'Escape' && S.lumen) { S.lumen = false; render(); return; }
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  const dir = e.key === 'ArrowRight' ? 1 : -1;
  if (S.route === 'shelf') { const L = list(); const i = L.findIndex((b) => b.id === S.focus); const j = i + dir; if (L[j]) { setFocus(L[j].id); e.preventDefault(); } }
  if (S.route === 'book' && G) { G.reader.go(dir); e.preventDefault(); }
});

// dragging in the 3D scene (shelf spin / page turn); the canvas sits under the UI layer
let drag = null;
addEventListener('pointerdown', (e) => {
  if (!G || e.target !== G.stage.renderer.domElement) return;
  if (S.route === 'shelf') drag = { kind: 'shelf', x: e.clientX, start: G.shelf.target, moved: 0 };
  if (S.route === 'book') {
    const m = G.reader.metrics();
    const dir = e.clientX > m.spine ? 1 : -1;
    drag = { kind: 'page', x: e.clientX, dir, page: m.page, moved: 0, t: performance.now(), started: false };
  }
});
addEventListener('pointermove', (e) => {
  if (!G) return;
  if (G && S.route === 'shelf') G.shelf.pointer((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  if (!drag) return;
  const dx = e.clientX - drag.x;
  drag.moved = Math.max(drag.moved, Math.abs(dx));
  if (drag.kind === 'shelf') { G.shelf.target = Math.max(0, Math.min(G.shelf.count - 1, drag.start - dx / 46)); }
  if (drag.kind === 'page' && drag.moved > 6) {
    if (!drag.started) drag.started = G.reader.dragStart(drag.dir) || 'no';
    if (drag.started === true) G.reader.dragMove((drag.dir > 0 ? -dx : dx) / (drag.page * 1.7));
  }
});
addEventListener('pointerup', (e) => {
  if (!drag || !G) return;
  const d = drag; drag = null;
  if (d.kind === 'shelf') {
    if (d.moved < 5) { if (!G.shelf.click()) return; return; }
    const L = list();
    const j = Math.round(G.shelf.target);
    if (L[j]) { S.focus = null; setFocus(L[j].id); }
  }
  if (d.kind === 'page') {
    if (d.started === true) { const v = Math.abs(e.clientX - d.x) / Math.max(1, performance.now() - d.t); G.reader.dragEnd(v); }
    else if (d.moved < 6) G.reader.go(d.dir);
  }
});

/* ------------------------------------------------------------------ the 3D layer */
async function start3D() {
  const { Stage } = await import('./scene/stage.js');
  if (!Stage.supported()) { document.documentElement.classList.add('no-gl'); return; }
  await Promise.all(["500 64px 'Cormorant Garamond'", "italic 500 64px 'Cormorant Garamond'", '600 16px Manrope'].map((f) => document.fonts.load(f).catch(() => null)));
  const [{ Shelf }, { Reader }] = await Promise.all([import('./scene/shelf.js'), import('./scene/reader.js')]);
  const stage = new Stage(document.getElementById('stage'));
  const shelf = new Shelf(stage, SHELF);
  const reader = new Reader(stage);
  G = { stage, shelf, reader, camSnap: true };
  shelf.on('focus', (b) => { S.focus = null; setFocus(b.id); });
  shelf.on('open', (b) => { location.hash = `#/book/${b.id}`; });
  shelf.on('hover', (b) => { stage.renderer.domElement.style.cursor = b ? 'pointer' : ''; });
  reader.emitChange = (at) => { S.at = at; S.hourTarget = at >= 0 ? reader.hours[at] : hourOf(reader.bookData.hour); if (S.route === 'book') { S._keepScroll = true; render(); } };
  syncShelf();
  shelf.f = shelf.target;
  if (S.route === 'book') { reader.load(BOOKS[S.param]); reader.group.visible = true; shelf.visible = 0; render(); setTimeout(() => reader.go(1), 900); }

  const V3 = (x, y, z) => ({ x, y, z });
  stage.frames.add((dt) => {
    const wide = stage.camera.aspect >= 1;
    const k = G.camSnap || reduced() ? 1 : 1 - Math.pow(0.03, dt);
    G.camSnap = false;
    let pos, look;
    if (S.route === 'book') {
      pos = wide ? V3(-1.7, 10.6, 7.4) : V3(0, 14, 8.6);
      look = wide ? V3(-1.7, 0, 0.35) : V3(0, 0, 1.9);
      reader.setPointer(stage.pointer.sx, stage.pointer.sy);
    } else {
      const shelfOn = S.route === 'shelf';
      shelf.visible += ((shelfOn ? 1 : 0) - shelf.visible) * k;
      pos = wide ? V3(stage.pointer.sx * 0.5, 1.5 + stage.pointer.sy * 0.2, 15.5) : V3(0, 1.6, 24);
      look = wide ? V3(0, -0.85, -1) : V3(0, 0.0, -1);
      if (!shelfOn) { pos = V3(pos.x, pos.y + 6, pos.z + 4); }
      stage.bgU.uDim.value += ((shelfOn ? 1 : 0.92) - stage.bgU.uDim.value) * k;
    }
    stage.camera.position.x += (pos.x - stage.camera.position.x) * k;
    stage.camera.position.y += (pos.y - stage.camera.position.y) * k;
    stage.camera.position.z += (pos.z - stage.camera.position.z) * k;
    stage.look.x += (look.x - stage.look.x) * k; stage.look.y += (look.y - stage.look.y) * k; stage.look.z += (look.z - stage.look.z) * k;
    stage.lamp.position.set(S.route === 'book' ? 2.6 : 0, S.route === 'book' ? 4 : 3.4, S.route === 'book' ? -1.4 : 3);
  });
  light(true);
}

/* ------------------------------------------------------------------ clock loop */
function tick() {
  requestAnimationFrame(tick);
  const d = S.hourTarget - S.hour;
  if (Math.abs(d) > 0.002) { S.hour += reduced() ? d : d * 0.08; light(); }
}

addEventListener('hashchange', navigate);
navigate().then(() => { tick(); start3D(); });
void MOODS;
