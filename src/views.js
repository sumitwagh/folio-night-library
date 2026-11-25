// HTML for every screen. Each function returns markup for the #ui layer; interactions are wired
// by data-act attributes in main.js. All content comes from library.js / data.js.
import { SHELF, BOOKS, AUTHORS, ROOMS, READERS, MOODS, HALL, ASKS, SEALS, clockOf, hourOf } from './library.js';
import { motifCSS, coverVars } from './covers.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const I = {
  shelf: 'M4 19V6M8.5 19V6M13 19l3.2-13 3.3.8-3.2 13M3 19h18',
  authors: 'M6 21V10a6 6 0 0 1 12 0v11M9 21v-5a3 3 0 0 1 6 0v5',
  rooms: 'M4 21V8l8-5 8 5v13M9 21v-6h6v6M8 10.5h2M14 10.5h2',
  lanterns: 'M9 4h6M10 4v2M14 4v2M7 8c0-1 1-2 2-2h6c1 0 2 1 2 2v8c0 1-1 2-2 2H9c-1 0-2-1-2-2zM12 18v2',
  desk: 'M3 10h18M5 10v10M19 10v10M8 10V6h8v4',
};
const icon = (d, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

export function domBook(b, w = 120) {
  const h = Math.round(w * 1.5);
  return `<span class="b3" style="--w:${w}px;--h:${h}px;--t:${Math.round(w * 0.16)}px;${coverVars(b)}"><span class="b3-in"><span class="b3-f"><span class="b3-m" style="${motifCSS(b)}"></span><span class="b3-x"><span class="b3-g">${esc(b.g)}</span><span class="b3-t">${esc(b.t)}</span><span class="b3-a">${esc(b.an)}</span></span><span class="b3-gl"></span></span><span class="b3-s"></span><span class="b3-p"></span></span></span>`;
}

export function chrome(s, night) {
  const tab = s.route === 'book' ? 'shelf' : s.route === 'author' ? 'authors' : s.route;
  const tabs = [['shelf', 'Shelf', '#/'], ['authors', 'Authors', '#/authors'], ['rooms', 'Rooms', '#/rooms'], ['lanterns', 'Lanterns', '#/lanterns'], ['desk', 'Desk', '#/desk']];
  return `
  <header class="top">
    <a href="#/" class="mark" aria-label="Nocturne, home">
      <svg width="26" height="30" viewBox="0 0 26 30" aria-hidden="true"><path d="M2 29V13a11 11 0 0 1 22 0v16z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="13" r="4.5" fill="currentColor"/><circle cx="14.4" cy="11.4" r="4" fill="var(--wall)"/><path d="M6 29v-6M9.5 29v-8M13 29v-5M16.5 29v-7M20 29v-5" stroke="var(--accent)" stroke-width="2"/></svg>
      <span class="mark-w">Nocturne</span>
    </a>
    <button type="button" class="clock" data-act="clock" aria-label="It is ${clockOf(s.hour)} in the library, ${esc(night.name)}. Change the hour">
      <span class="clock-d" style="--a:${((s.hour - 18) / 12) * 180}deg"></span><b>${clockOf(s.hour)}</b><span>${esc(night.name)}</span>
    </button>
    <div class="top-r">
      <button type="button" class="ask" data-act="lumen" aria-expanded="${s.lumen ? 'true' : 'false'}">✦ <span>Ask Lumen</span></button>
      <a href="#/desk" class="me" aria-label="Your desk, Aanya Rao">A</a>
    </div>
  </header>
  <nav class="tabs" aria-label="Rooms of the library">
    ${tabs.map(([id, label, href]) => `<a href="${href}" class="tab" aria-current="${tab === id ? 'page' : 'false'}">${icon(I[id], 17)}<span>${label}</span></a>`).join('')}
  </nav>
  ${s.lumen ? lumen(s) : ''}`;
}

function lumen(s) {
  const a = s.ask != null ? ASKS[s.ask] : null;
  return `<div class="lumen" role="dialog" aria-label="Ask Lumen, the night librarian">
    <div class="lumen-h"><span class="kick">✦ LUMEN · THE NIGHT LIBRARIAN</span><button type="button" data-act="lumen" aria-label="Close">×</button></div>
    <p class="lumen-q">What kind of night is it?</p>
    <div class="chips">${ASKS.map(([label], i) => `<button type="button" data-act="ask" data-i="${i}" aria-pressed="${s.ask === i}">${esc(label)}</button>`).join('')}</div>
    ${s.askPh === 'thinking' ? '<div class="lumen-t"><span class="dots"><i></i><i></i><i></i></span>Reading your 214 highlights…</div>' : ''}
    ${a && s.askPh === 'done' ? `<div class="lumen-a"><p>${esc(a[2])}</p><button type="button" class="pill pri" data-act="showbook" data-id="${a[1]}">Find it on the shelf →</button></div>` : ''}
  </div>`;
}

/* ------------------------------------------------------------------ the shelf */
export function shelfView(s, list, focus) {
  const idx = list.findIndex((b) => b.id === focus.id);
  const start = 18, span = 12;
  const pct = (h) => ((h - start) / span) * 100;
  const ticks = [];
  for (let m = 0; m <= span * 3; m++) ticks.push(`<i style="left:${(m / (span * 3)) * 100}%" class="${m % 3 ? '' : 'big'}"></i>`);
  const labels = Array.from({ length: span + 1 }, (_, i) => `<span style="left:${(i / span) * 100}%">${String((18 + i) % 24).padStart(2, '0')}</span>`).join('');
  return `
  <section class="shelf-ui" aria-labelledby="shT">
    <div class="shelf-head">
      <div class="kick">${esc(s.dayNote)}</div>
      <h1 id="shT" class="shelf-h">Turn the shelf.<br><em>Take one down.</em></h1>
    </div>
    <div class="moods" role="group" aria-label="Which shelf">
      ${MOODS.map(([k, label]) => `<button type="button" data-act="mood" data-k="${k}" aria-pressed="${s.mood === k}">${label}</button>`).join('')}
    </div>
    <div class="cap" aria-live="polite">
      <button type="button" class="arw" data-act="prev" aria-label="Previous book" ${idx <= 0 ? 'disabled' : ''}>←</button>
      <div class="cap-in">
        <div class="cap-k">NO. ${focus.no} · BEST READ AT ${focus.hour} · ${esc(focus.g.toUpperCase())}</div>
        <h2 class="cap-t">${esc(focus.t)}</h2>
        <a href="#/author/${focus.a}" class="cap-a">${esc(focus.an)}</a>
        <div class="cap-b">
          <button type="button" class="pill pri" data-act="open" data-id="${focus.id}">${focus.upcoming ? 'Read the field logs' : 'Open the book'}</button>
          <button type="button" class="pill ghost" data-act="shelve" data-id="${focus.id}" aria-pressed="${!!s.shelf[focus.id]}">${s.shelf[focus.id] ? 'On my desk ✓' : '+ My desk'}</button>
        </div>
      </div>
      <button type="button" class="arw" data-act="next" aria-label="Next book" ${idx >= list.length - 1 ? 'disabled' : ''}>→</button>
    </div>
    <div class="dial" data-dial role="slider" tabindex="0" aria-label="The hour of the night" aria-valuemin="18" aria-valuemax="30" aria-valuenow="${s.hour.toFixed(2)}" aria-valuetext="${clockOf(s.hour)}, ${esc(focus.t)}">
      <div class="dial-track">${ticks.join('')}
        ${list.map((b) => `<b class="dial-dot${b.id === focus.id ? ' on' : ''}" style="left:${pct(hourOf(b.hour))}%;--c:${b.ac}" title="${esc(b.t)} · ${b.hour}"></b>`).join('')}
        <span class="dial-head" style="left:${pct(s.hour)}%"><em>${clockOf(s.hour)}</em></span>
      </div>
      <div class="dial-l">${labels}</div>
    </div>
    <div class="hint" aria-hidden="true">Drag the shelf · scrub the night · click a spine</div>
  </section>`;
}

/* ------------------------------------------------------------------ the reading table */
export function bookView(s, b, at, hours) {
  const room = ROOMS.find((r) => r.id === b.room);
  const N = hours.length;
  return `
  <section class="rd-ui" aria-labelledby="bkT">
    <div class="ghostnum" aria-hidden="true">${b.no}</div>
    <aside class="rd-panel">
      <a href="#/" class="back">← Back to the shelf</a>
      <div class="kick">NO. ${b.no} · ${esc(b.g.toUpperCase())} · ${b.upcoming ? 'OUT 14 MARCH 2027' : `★ ${b.r}`}</div>
      <h1 id="bkT" class="rd-t">${esc(b.t)}</h1>
      <a href="#/author/${b.a}" class="rd-a"><span style="background:${AUTHORS[b.a].c}">${AUTHORS[b.a].i}</span>${esc(b.an)}</a>
      <p class="rd-p">${esc(b.blurb)}</p>
      <div class="rd-meta"><span>${N} hours</span><span>${b.pg || '—'} pages</span><span>${esc(b.rd)} reading tonight</span></div>
      <ol class="chap" aria-label="Chapters, one for each hour">
        ${hours.map((h, i) => `<li><button type="button" data-act="goto" data-i="${i}" aria-current="${at === i ? 'true' : 'false'}"><span class="chap-n">${String(i + 1).padStart(2, '0')}</span><span class="chap-t">${i === N - 1 ? 'Thank you for reading slowly' : esc(b.chapters[i])}</span><span class="chap-h">${clockOf(h)}</span></button></li>`).join('')}
      </ol>
      <div class="rd-c">
        <a href="#/rooms/${b.room}" class="pill pri">Join tonight’s room · ${room ? room.live.toLocaleString('en-US') : 0}</a>
        <button type="button" class="pill ghost" data-act="shelve" data-id="${b.id}" aria-pressed="${!!s.shelf[b.id]}">${s.shelf[b.id] ? 'On my desk ✓' : '+ My desk'}</button>
      </div>
    </aside>
    <div class="pager">
      <button type="button" class="arw" data-act="pprev" aria-label="Previous page" ${at < 0 ? 'disabled' : ''}>←</button>
      <div class="pdots" role="group" aria-label="Spreads">
        <button type="button" data-act="goto" data-i="-1" aria-label="Cover" aria-current="${at === -1}" class="pd"></button>
        ${hours.map((h, i) => `<button type="button" data-act="goto" data-i="${i}" aria-label="${clockOf(h)}" aria-current="${at === i}" class="pd"></button>`).join('')}
      </div>
      <button type="button" class="arw" data-act="pnext" aria-label="Next page" ${at >= N - 1 ? 'disabled' : ''}>→</button>
    </div>
    <div class="rd-hint" aria-hidden="true">${at < 0 ? 'Click the cover, or drag it open' : 'Drag a page to turn it · ← → keys'}</div>
    ${at === N - 1 ? `<div class="rd-end"><a href="#/" class="pill pri">Back to the shelf</a><button type="button" class="pill ghost" data-act="goto" data-i="0">Read it again</button></div>` : ''}
  </section>`;
}

/* ------------------------------------------------------------------ authors */
export function authorsView(s) {
  const keys = Object.keys(AUTHORS);
  return `
  <section class="page" aria-labelledby="auT">
    <div class="page-h"><div class="kick">THE PORTRAIT GALLERY · ${keys.length} WRITERS IN RESIDENCE</div><h1 id="auT" class="ph">Walk among the <em>writers.</em></h1>
    <p class="pp">Each niche is lit while its writer is awake. Step in to read their letters — the daily stories that become chapters.</p></div>
    <div class="niches">
      ${keys.map((k, i) => { const a = AUTHORS[k]; const lit = i % 3 !== 2; return `
      <a href="#/author/${k}" class="niche${lit ? ' lit' : ''}" style="--c:${a.c};--d:${i * 0.05}s">
        <span class="niche-arch"><span class="niche-glow"></span><span class="bust">${a.i}</span>
          <span class="niche-books">${a.books.map((bk) => `<i style="background:${BOOKS[bk].sp};border-top:3px solid ${BOOKS[bk].ac}"></i>`).join('')}<i style="background:#444"></i></span></span>
        <span class="niche-n">${esc(a.n)}</span><span class="niche-g">${esc(a.g)}</span>
        <span class="niche-s">${lit ? '● writing tonight' : '○ asleep'} · ${(a.f / 1000).toFixed(1)}k followers</span>
      </a>`; }).join('')}
    </div>
  </section>`;
}

export function authorView(s, k) {
  const a = AUTHORS[k];
  const on = !!s.follows[k];
  const li = (s.letter || 0) % a.letters.length;
  return `
  <section class="page au-page" aria-labelledby="aT">
    <a href="#/authors" class="back">← The gallery</a>
    <div class="au-grid">
      <div class="au-arch" style="--c:${a.c}"><span class="bust big">${a.i}</span></div>
      <div>
        <div class="kick">${esc(a.g.toUpperCase())}</div>
        <h1 id="aT" class="ph">${esc(a.n)}</h1>
        <p class="pp">${esc(a.bio)}</p>
        <div class="stats"><div><b>${(a.f + (on ? 1 : 0)).toLocaleString('en-US')}</b>followers</div><div><b>${a.inf}</b>influence</div><div><b>${a.logs}</b>letters</div></div>
        <div class="row"><button type="button" class="pill ${on ? 'ghost' : 'pri'}" data-act="follow" data-k="${k}" aria-pressed="${on}">${on ? 'Following ✓' : 'Follow ' + esc(a.n.split(' ')[0])}</button><a href="#/rooms/${a.room}" class="pill ghost">Visit their reading room</a></div>
        <div class="letters-h"><span class="kick">LETTERS · DAILY STORIES</span><button type="button" class="pill ghost sm" data-act="letter">Next letter →</button></div>
        <div class="letters">
          ${a.letters.map((l, i) => { const pos = (i - li + a.letters.length) % a.letters.length; return `<article class="letter" style="--p:${pos};z-index:${10 - pos};opacity:${pos > 2 ? 0 : 1 - pos * 0.2}" aria-hidden="${pos !== 0}"><div class="letter-h"><span>${esc(l[0])}</span><span>${esc(l[1])}</span></div><p>${esc(l[2])}</p><span class="letter-b">${esc(l[3])}</span></article>`; }).join('')}
        </div>
        <div class="kick" style="margin-top:34px">ON THE SHELF</div>
        <div class="au-books">${a.books.map((bk) => `<a href="#/book/${bk}" aria-label="Open ${esc(BOOKS[bk].t)}">${domBook(BOOKS[bk], 110)}</a>`).join('')}
        ${a.up ? `<div class="forth"><div class="kick">FORTHCOMING · ${esc(a.upWhen)}</div><div class="forth-t">${esc(a.up)}</div><button type="button" class="pill ghost sm" data-act="notify" data-k="${k}" aria-pressed="${!!s.notify[k]}">${s.notify[k] ? 'On the waitlist ✓' : 'Notify me at launch'}</button></div>` : ''}</div>
      </div>
    </div>
  </section>`;
}

/* ------------------------------------------------------------------ reading rooms */
export function roomsView(s, id) {
  const rm = ROOMS.find((r) => r.id === id);
  const total = ROOMS.reduce((a, r) => a + r.live, 0);
  const extra = (s.extra[id] || []);
  const dig = (s.dig || {})[id] || 'idle';
  return `
  <section class="page" aria-labelledby="rmT">
    <div class="page-h"><div class="kick">THE COMMONS · ${total.toLocaleString('en-US')} READERS AWAKE</div><h1 id="rmT" class="ph">Every lit window is a <em>reading room.</em></h1></div>
    <div class="rooms-grid">
      <div class="facade" role="group" aria-label="Reading rooms">
        ${ROOMS.map((r) => `<a href="#/rooms/${r.id}" class="win${r.id === id ? ' on' : ''}" style="--h:${(0.15 + r.heat * 0.85).toFixed(2)}" aria-label="${esc(r.n)}, ${r.live} inside" aria-current="${r.id === id}">
          <span class="win-glass"><span class="win-sil"></span></span><span class="win-n">${esc(r.short)}</span><span class="win-l">${r.live.toLocaleString('en-US')} inside</span></a>`).join('')}
      </div>
      <div class="room-panel">
        ${!rm ? '<p class="room-empty">Pick a window. The brighter it glows, the more people are reading and talking inside.</p>' : `
        <div class="room-h"><div><div class="kick">${esc(rm.kind)} · ${rm.live.toLocaleString('en-US')} INSIDE</div><h2 class="room-t">${esc(rm.n)}</h2></div><a href="#/rooms" class="x" aria-label="Leave the room">×</a></div>
        <div class="msgs">
          ${rm.msgs.map(([who, i, c, tag, text]) => ({ who, i, c, tag, text })).concat(extra).map((m) => `<div class="msg"><span class="av" style="background:${m.c}">${esc(m.i)}</span><div><b>${esc(m.who)}</b>${m.tag ? `<em>${esc(m.tag)}</em>` : ''}<p>${esc(m.text)}</p></div></div>`).join('')}
        </div>
        ${dig === 'idle' ? `<button type="button" class="lum-btn" data-act="digest" data-id="${rm.id}">✦ Ask Lumen to catch me up</button>` : dig === 'thinking' ? '<div class="lumen-t"><span class="dots"><i></i><i></i><i></i></span>Reading the whole room…</div>' : `<div class="digest"><b>✦ Lumen</b> ${esc(rm.digest)}</div>`}
        <form class="say" data-act="say" data-id="${rm.id}"><label class="sr" for="sayIn">Say something</label><input id="sayIn" name="t" placeholder="Say something to the room…" autocomplete="off"><button type="submit" class="pill pri sm">Send</button></form>`}
      </div>
    </div>
  </section>`;
}

/* ------------------------------------------------------------------ lanterns */
export function lanternsView(s) {
  const cat = s.hall;
  const list = HALL[cat];
  const max = list[0].sc, min = list[list.length - 1].sc;
  return `
  <section class="page" aria-labelledby="lnT">
    <div class="page-h row"><div><div class="kick">THE HALL OF LANTERNS · THIS WEEK</div><h1 id="lnT" class="ph">The brightest lanterns <em>rise highest.</em></h1></div>
      <div class="seg" role="tablist" aria-label="Who">${Object.keys(HALL).map((c) => `<button type="button" role="tab" data-act="hall" data-k="${c}" aria-selected="${c === cat}">${c}</button>`).join('')}</div></div>
    <ol class="lanterns" aria-label="${cat} ranked">
      ${list.map((p, j) => `<li style="--h:${Math.round(90 + ((p.sc - min) / Math.max(1, max - min)) * 280)}px;--g:${(1 - j * 0.12).toFixed(2)};--d:${j * 0.08}s">
        <a href="${p.kind === 'author' ? `#/author/${p.k}` : '#/lanterns'}" class="lan" aria-label="${j + 1}. ${esc(p.n)}, ${p.sc}">
          <span class="lan-body" style="--c:${p.c}"><span class="lan-i">${esc(p.i)}</span></span>
          <span class="lan-string"></span>
          <span class="lan-n"><b>${j + 1}</b> ${esc(p.n)}</span><span class="lan-s">${p.sc} ${cat === 'Authors' ? 'influence' : cat === 'Readers' ? 'books' : 'helpful reviews'}</span>
        </a></li>`).join('')}
    </ol>
    <p class="pp center">Lanterns rise with what you give the library: chapters finished, reviews others found helpful, rooms you kept alive past midnight.</p>
  </section>`;
}

/* ------------------------------------------------------------------ your desk */
export function deskView(s) {
  const mine = Object.keys(s.shelf).filter((k) => s.shelf[k]);
  const prog = { carto: 64, salt: 31, weight: 88 };
  const seal = s.seal || 0;
  return `
  <section class="page" aria-labelledby="dkT">
    <div class="page-h"><div class="kick">YOUR DESK · LEVEL 7 · 23-NIGHT STREAK</div><h1 id="dkT" class="ph">Good evening, <em>Aanya.</em></h1></div>
    <div class="desk">
      <div class="card">
        <div class="kick">ON YOUR DESK · ${mine.length} BOOKS</div>
        <div class="desk-books">${mine.map((k) => `<a href="#/book/${k}" class="db"><span class="db-b">${domBook(BOOKS[k], 96)}</span><span class="db-t">${esc(BOOKS[k].t)}</span><span class="db-bar"><i style="width:${prog[k] || 0}%"></i></span><span class="db-p">${prog[k] ? prog[k] + '% read' : 'Not started'}</span></a>`).join('') || '<p class="pp">Nothing here yet — take a book down from the shelf.</p>'}</div>
      </div>
      <div class="card">
        <div class="kick">THIS WEEK'S CANDLES</div>
        <div class="candles">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, j) => `<span class="candle${j < 6 ? ' lit' : ''}"><i></i><b>${d}</b></span>`).join('')}</div>
        <p class="pp sm">Read tonight to light Sunday’s candle and keep your 23-night streak.</p>
      </div>
      <div class="card">
        <div class="kick">WAX SEALS</div>
        <div class="seals">${SEALS.map(([n, mark, , got], j) => `<button type="button" class="seal${got ? ' got' : ''}" data-act="seal" data-i="${j}" aria-pressed="${seal === j}" aria-label="${esc(n)}"><span>${mark}</span></button>`).join('')}</div>
        <p class="pp sm"><b>${esc(SEALS[seal][0])}</b> — ${esc(SEALS[seal][2])}</p>
      </div>
      <div class="card">
        <div class="kick">YOUR ROOMS</div>
        ${['r1', 'r3', 'r5'].map((id) => { const r = ROOMS.find((x) => x.id === id); return `<a href="#/rooms/${id}" class="myroom"><span>${esc(r.n)}</span><b>${r.live} inside →</b></a>`; }).join('')}
      </div>
    </div>
  </section>`;
}

export { SHELF, BOOKS, READERS };
