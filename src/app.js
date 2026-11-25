import { ViewModel } from './runtime.js';
import { books as B, authors as A, rooms as ROOMS, readers as READERS } from './data.js';

// All screens, state and interactions for The Night Library.
// bindings() returns every value and handler the template in index.html uses.
export default class NightLibrary extends ViewModel {
  bindings() {
    const s = this.state;
    const vt = (fn) => { if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) { document.startViewTransition(() => new Promise((r) => { fn(); setTimeout(r, 50); })); } else fn(); };
    const go = (view, extra) => vt(() => { this.setState({ view, lamp: false, card: null, ...(extra || {}) }); try { window.scrollTo(0, 0); } catch (e) {} });
    const view = s.view || 'stacks';
    const MOODS = [['all','All shelves'],['strange','Something strange'],['warm','Something warm'],['tears','A good cry'],['fast','One more chapter']];
    const mood = s.mood || 'all';
    const list = Object.keys(B).filter((k) => mood === 'all' || B[k].mood.indexOf(mood) > -1);
    const n = list.length, step = 360 / n, rot = s.rot || 0, fi = ((rot % n) + n) % n, fk = list[fi];
    const shelfSet = s.shelf || { carto: true, salt: true, weight: true };
    const prog = { carto: 64, salt: 31, weight: 88 };
    const bkKey = s.book && B[s.book] ? s.book : 'carto';
    const bk = B[bkKey];
    const auKey = s.author && A[s.author] ? s.author : 'mira';
    const au = A[auKey];
    const follows = s.follows || {};
    const roomId = s.room;
    const rm = ROOMS.find((r) => r.id === roomId);
    const extraMsgs = s.extra || {};
    const dig = (s.dig || {})[roomId] || 'idle';
    const hallCat = s.hall || 'Authors';
    const openBook = (k) => go('book', { book: k, open: false, credit: null });
    const openAuthor = (k) => go('author', { author: k, letter: 0 });
    const openRoom = (id) => go('commons', { room: id });
    const pal = (on) => on ? 'background:#EDEAF5;color:#070912;border:1px solid #EDEAF5' : 'background:transparent;color:#EDEAF5;border:1px solid rgba(200,210,255,.22)';
    const setRot = (r) => this.setState({ rot: r });
    const ICON = { stacks:'M4 19V5M9 19V5M14 19l3-14 3 1-3 14', authors:'M5 4h14v16H5zM9 9a3 3 0 1 0 6 0 3 3 0 1 0-6 0M7 18c1-3 9-3 10 0', commons:'M3 21V9l9-6 9 6v12M9 21v-6h6v6M7 11h2M15 11h2', hall:'M6 21V11M12 21V5M18 21v-8', you:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-5 15-5 16 0' };
    const LABELS = { stacks:'The Stacks', book:'A book, on the table', authors:'The Portrait Gallery', author:'A portrait', commons:'The Commons', hall:'The Hall of Lanterns', you:'Your desk' };
    const dockKey = view === 'book' ? 'stacks' : view === 'author' ? 'authors' : view;
    const HALL = {
      Authors: [['mira',94],['dev',91],['hana',88],['sana',85],['theo',82],['lena',80]].map(([k, sc]) => ({ k, kind:'author', n: A[k].n, i: A[k].i, c: A[k].c, sc })),
      Readers: [['leila',61],['kabir',58],['tomas',54],['nora',49],['priya',47],['atlas',44]].map(([k, sc]) => ({ k, kind:'reader', n: READERS[k].n, i: READERS[k].i, c: READERS[k].c, sc })),
      Reviewers: [['leila',84],['atlas',69],['kabir',52],['nora',41],['priya',38],['tomas',22]].map(([k, sc]) => ({ k, kind:'reader', n: READERS[k].n, i: READERS[k].i, c: READERS[k].c, sc }))
    };
    const hl = HALL[hallCat];
    const max = hl[0].sc;
    const rcKey = s.card;
    const rc = rcKey ? READERS[rcKey] : null;
    const ASKS = [['Something strange tonight','orchard','Orchard of Small Gods — myth told slowly, and a god who has stopped answering. You liked Cartographer’s quiet strangeness; this is its warmer cousin.'],['A short read','field','Fieldnotes for the End of Summer — 96 pages, one poem per hour. Perfect for your usual 20 minutes before bed.'],['More like Cartographer','glass','Glasshouse Protocol — a city with a mind of its own. Readers who finished Cartographer rated it 4.9.'],['What is Kabir reading?','weight','Kabir is 81% into The Weight of Light. Your tastes match 91%, and he gave it five stars.']];
    const ask = s.ask;
    const lampPh = s.lph || 'idle';
    const sealsD = [['Night Owl II','☾','Read past midnight on 20 nights.',1],['First Review','✎','Wrote your first review, of Cartographer.',1],['23 Nights','✦','Read 23 nights in a row — your longest streak.',1],['Trendsetter','↗','Shelved a book before it hit the top 10.',1],['Q&A Regular','?','Attend three author Q&As (2 of 3).',0],['Century Club','C','Read 100 books on Folio (23 of 100).',0]];
    const seal = s.seal ?? 2;
    return {
      roomLabel: LABELS[view].toUpperCase(),
      isStacks: view === 'stacks', isBook: view === 'book', isAuthors: view === 'authors', isAuthor: view === 'author', isCommons: view === 'commons', isHall: view === 'hall', isYou: view === 'you',
      toStacks: () => go('stacks'), toYou: () => go('you'), toAuthors: () => go('authors'),
      dock: ['stacks','authors','commons','hall','you'].map((k) => ({ label: { stacks:'Stacks', authors:'Authors', commons:'Commons', hall:'Hall', you:'You' }[k], icon: ICON[k], cur: k === dockKey ? 'page' : 'false', pick: () => go(k), style: k === dockKey ? 'background:#FFB86B;color:#1A0F02' : 'color:#D9D8E6' })),
      count: n,
      moods: MOODS.map(([k, label]) => ({ label, on: k === mood ? 'true' : 'false', pick: () => vt(() => this.setState({ mood: k, rot: 0 })), style: pal(k === mood) })),
      ringA: (-rot * step).toFixed(2),
      shelf: list.map((k, i) => { let d = Math.abs(i - fi); d = Math.min(d, n - d); return { ...B[k], ang: (i * step).toFixed(2), op: Math.max(0.22, 1 - d * 0.22).toFixed(2), cls: i === fi ? 'front' : '', aria: i === fi ? 'Take down ' + B[k].t : 'Turn to ' + B[k].t, pick: () => { if (this._sup) { this._sup = false; return; } if (i === fi) openBook(k); else { let delta = i - fi; if (delta > n / 2) delta -= n; if (delta < -n / 2) delta += n; setRot(rot + delta); } } }; }),
      prev: () => setRot(rot - 1), next: () => setRot(rot + 1),
      dDown: (e) => { this._dr = { x: e.clientX, moved: false, el: e.currentTarget.querySelector('[data-ring]'), id: e.pointerId }; },
      dMove: (e) => { const d = this._dr; if (!d) return; const dx = e.clientX - d.x; if (!d.moved && Math.abs(dx) > 8) { d.moved = true; try { e.currentTarget.setPointerCapture(d.id); } catch (er) {} if (d.el) d.el.style.transition = 'none'; } if (d.moved && d.el) d.el.style.transform = 'translateZ(calc(var(--R) * -1)) rotateY(' + (-rot * step + dx * 0.3) + 'deg)'; },
      dUp: (e) => { const d = this._dr; this._dr = null; if (!d || !d.moved) return; const dx = e.clientX - d.x; const nr = rot - Math.round((dx * 0.3) / step); if (d.el) { d.el.style.transition = ''; d.el.style.transform = 'translateZ(calc(var(--R) * -1)) rotateY(' + (-nr * step).toFixed(2) + 'deg)'; } this._sup = true; setTimeout(() => { this._sup = false; }, 60); setRot(nr); },
      front: { ...B[fk] }, frontAuthor: () => openAuthor(B[fk].a), openFront: () => openBook(fk),
      frontShelved: shelfSet[fk] ? 'true' : 'false', frontShelfLabel: shelfSet[fk] ? 'On my shelf ✓' : '+ Add to my shelf',
      toggleFrontShelf: () => this.setState({ shelf: { ...shelfSet, [fk]: !shelfSet[fk] } }),
      bk, tblT: s.open ? 'translateX(calc(var(--cw) * .7)) rotateX(8deg)' : 'rotateY(-22deg) rotateX(10deg)', lidA: s.open ? -170 : 0,
      toggleOpen: () => this.setState({ open: !s.open }), openLabel: s.open ? 'Close the book' : 'Open the book',
      bkShelved: shelfSet[bkKey] ? 'true' : 'false', bkShelfLabel: shelfSet[bkKey] ? 'On my shelf ✓' : '+ Add to my shelf',
      toggleBkShelf: () => this.setState({ shelf: { ...shelfSet, [bkKey]: !shelfSet[bkKey] } }),
      bookAuthor: () => openAuthor(bk.a), toBookRoom: () => openRoom(bk.room), bkRoomLive: (ROOMS.find((r) => r.id === bk.room) || {}).live,
      credits: [{ role: 'Author', n: bk.an, i: A[bk.a].i, bg: A[bk.a].c, pick: () => openAuthor(bk.a) }].concat(bk.cr.map(([role, nm]) => ({ role, n: nm, i: nm.split(' ').map((w) => w[0]).join('').slice(0, 2), bg: '#3A4266', pick: () => this.setState({ credit: s.credit === nm ? null : nm }) }))),
      hasCredit: !!s.credit && bk.cr.some((c) => c[1] === s.credit), creditNote: (() => { const c = bk.cr.find((x) => x[1] === s.credit); return c ? c[1] + ' · ' + c[0] + ' on ' + bk.t + '. Credited contributors are shown on every edition and share in its royalties on Folio.' : ''; })(),
      gallery: ['mira','dev','hana','sana','theo','lena','arjun','iris'].map((k, i) => { const side = i % 2 ? 1 : -1; return { ...A[k], pick: () => openAuthor(k), tf: 'translate3d(calc(var(--cx) * ' + (side * (1 + Math.floor(i / 2) * 0.367) * (1 + Math.floor(i / 2) * 0.378)).toFixed(3) + '), 0, ' + (-Math.floor(i / 2) * 340) + 'px) rotateY(' + (-side * 38) + 'deg)', op: Math.floor(i / 2) < (s.cam || 0) ? 0 : 1, pe: Math.floor(i / 2) < (s.cam || 0) ? 'none' : 'auto', tab: Math.floor(i / 2) < (s.cam || 0) ? '-1' : '0' }; }),
      camZ: (s.cam || 0) * 340, camFwd: () => this.setState({ cam: Math.min(3, (s.cam || 0) + 1) }), camBack: () => this.setState({ cam: Math.max(0, (s.cam || 0) - 1) }),
      au, auFollowers: (au.f + (follows[auKey] ? 1 : 0)).toLocaleString(), auFollowOn: follows[auKey] ? 'true' : 'false', auFollowLabel: follows[auKey] ? 'Following ✓' : 'Follow ' + au.n.split(' ')[0],
      auFollowStyle: follows[auKey] ? 'background:transparent;color:#FFB86B;border:1px solid #FFB86B' : 'background:#FFB86B;color:#1A0F02',
      toggleFollow: () => this.setState({ follows: { ...follows, [auKey]: !follows[auKey] } }), toAuthorRoom: () => openRoom(au.room),
      letters: au.letters.map((l, i) => { const L = au.letters.length, top = (s.letter || 0) % L, pos = (i - top + L) % L; return { no: l[0], when: l[1], text: l[2], badge: l[3], z: 10 - pos, op: pos > 2 ? 0 : 1 - pos * 0.18, tf: 'translate3d(' + (pos * 22) + 'px,' + (pos * 14) + 'px,' + (-pos * 60) + 'px) rotate(' + (pos ? (pos % 2 ? 2.5 : -2) : 0) + 'deg)', pick: () => this.setState({ letter: i }) }; }),
      nextLetter: () => this.setState({ letter: ((s.letter || 0) + 1) % au.letters.length }),
      auBooks: au.books.map((k) => ({ ...B[k], pick: () => openBook(k) })),
      hasUp: !!au.up, notifyOn: (s.notify || {})[auKey] ? 'true' : 'false', notifyLabel: (s.notify || {})[auKey] ? 'On the waitlist ✓' : 'Notify me at launch',
      toggleNotify: () => this.setState({ notify: { ...(s.notify || {}), [auKey]: !(s.notify || {})[auKey] } }),
      liveTotal: ROOMS.reduce((a, r) => a + r.live, 0).toLocaleString(),
      rooms: ROOMS.map((r) => ({ ...r, on: r.id === roomId ? 'true' : 'false', light: 'rgba(255,184,107,' + (0.12 + r.heat * 0.78).toFixed(2) + ')', ring: r.id === roomId ? 'box-shadow:0 0 0 3px #EDEAF5,0 0 50px rgba(255,184,107,.6)' : '', live: r.live.toLocaleString(), pick: () => this.setState({ room: r.id }) })),
      noRoom: !rm, hasRoom: !!rm,
      rm: rm ? { ...rm, live: rm.live.toLocaleString(), count: rm.msgs.length + (extraMsgs[rm.id] || []).length + 40 } : { n: '', kind: '', live: '', digest: '', count: 0 },
      closeRoom: () => this.setState({ room: null }),
      seats: [0,1,2,3,4,5,6].map((j) => { const a = (j / 7) * Math.PI * 2; return { c: ['#FFB86B','#A9C4FF','#9FE3D1','#F2C14E','#C9A7FF','#F7D9A8','#E9E1D3'][j], x: Math.round(87 + Math.cos(a) * 88), y: Math.round(47 + Math.sin(a) * 48) }; }),
      msgs: rm ? rm.msgs.map(([who, i, c, tag, text]) => ({ who, i, c, tag, text })).concat(extraMsgs[rm.id] || []) : [],
      digIdle: dig === 'idle', digThinking: dig === 'thinking', digDone: dig === 'done',
      digest: () => { const id = roomId; this.setState({ dig: { ...(s.dig || {}), [id]: 'thinking' } }); clearTimeout(this._t1); this._t1 = setTimeout(() => this.setState({ dig: { ...((this.state).dig || {}), [id]: 'done' } }), 1100); },
      draft: s.draft || '', onDraft: (e) => this.setState({ draft: e.target.value }),
      send: () => { const t = (s.draft || '').trim(); if (!t || !rm) return; this.setState({ draft: '', extra: { ...extraMsgs, [rm.id]: (extraMsgs[rm.id] || []).concat([{ who: 'Aanya Rao', i: 'A', c: '#FFB86B', tag: 'YOU', text: t }]) } }); },
      hallCats: ['Authors','Readers','Reviewers'].map((c) => ({ label: c, on: c === hallCat ? 'true' : 'false', pick: () => this.setState({ hall: c }), style: pal(c === hallCat) })),
      lanterns: hl.map((p, j) => ({ ...p, rank: j + 1, score: p.sc, h: Math.round(90 + (p.sc / max) * 250), glow: (1 - j * 0.12).toFixed(2), bg: j === 0 ? '#FFB86B' : j < 3 ? '#E6A35C' : '#9C6E3E', aria: (j + 1) + '. ' + p.n + ', ' + p.sc, pick: () => { if (p.kind === 'author') openAuthor(p.k); else this.setState({ card: p.k }); } })),
      myShelf: Object.keys(shelfSet).filter((k) => shelfSet[k]).map((k, j) => ({ ...B[k], p: prog[k] || 0, rib: Math.max(8, prog[k] || 8), w: [46, 40, 54, 42, 50, 38, 44, 48][j % 8], h: [250, 228, 262, 236, 244, 232, 256, 240][j % 8], pick: () => openBook(k) })),
      shelfCount: Object.keys(shelfSet).filter((k) => shelfSet[k]).length,
      candles: ['M','T','W','T','F','S','S'].map((d, j) => ({ d, flame: j < 6 ? '#FFB86B' : 'transparent', glow: j < 6 ? '0 0 18px rgba(255,184,107,.8)' : 'none', op: j < 6 ? 1 : 0.35 })),
      seals: sealsD.map(([nm, mark, note, got], j) => ({ n: nm, mark, state: got ? 'earned' : 'in progress', on: seal === j ? 'true' : 'false', pick: () => this.setState({ seal: j }), sel: seal === j ? 'background:rgba(255,184,107,.1)' : '', look: got ? 'background:#9E2B25;color:#F6D9C9;box-shadow:inset 0 0 0 4px #B83A31,0 8px 18px -6px #000' : 'border:2px dashed rgba(200,210,255,.3);color:#8C90AB' })),
      sealNote: sealsD[seal][0] + ' — ' + sealsD[seal][2],
      myRooms: ['r1','r3','r5'].map((id) => { const r = ROOMS.find((x) => x.id === id); return { n: r.n, live: r.live, pick: () => openRoom(id) }; }),
      lampOpen: !!s.lamp, lampExp: s.lamp ? 'true' : 'false', toggleLamp: () => this.setState({ lamp: !s.lamp }),
      asks: ASKS.map(([label], j) => ({ label, pick: () => { this.setState({ ask: j, lph: 'thinking' }); clearTimeout(this._t2); this._t2 = setTimeout(() => this.setState({ lph: 'done' }), 1000); } })),
      lampThinking: lampPh === 'thinking', lampDone: lampPh === 'done' && ask != null,
      ans: ask != null ? { text: ASKS[ask][2], t: B[ASKS[ask][1]].t, go: () => { const k = ASKS[ask][1]; const all = Object.keys(B); go('stacks', { mood: 'all', rot: all.indexOf(k), lph: 'idle' }); } } : { text: '', t: '', go: () => {} },
      cardOpen: !!rc, rc: rc || { n: '', i: '', c: '', meta: '' }, closeCard: () => this.setState({ card: null }),
      rcBooks: rc ? rc.books.map((k) => ({ ...B[k], pick: () => openBook(k) })) : [],
      rcBadges: rc ? rc.badges.map((g) => ({ n: g })) : [],
      rcFollowOn: rcKey && (s.rf || {})[rcKey] ? 'true' : 'false', rcFollowLabel: rcKey && (s.rf || {})[rcKey] ? 'Following ✓' : 'Follow reader',
      rcFollowStyle: rcKey && (s.rf || {})[rcKey] ? 'background:transparent;color:#FFB86B;border:1px solid #FFB86B' : 'background:#FFB86B;color:#1A0F02',
      rcFollow: () => this.setState({ rf: { ...(s.rf || {}), [rcKey]: !(s.rf || {})[rcKey] } })
    };
  }
}
