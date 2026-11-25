// Page artwork for the reading table, painted on canvas. Each spread is one hour of the same
// night: a four-layer paper-cut landscape on the left (it shifts with your cursor) and the
// hour, chapter and text on the right.
import { nightAt } from '../night.js';
import { clockOf, hourOf } from '../library.js';

export const PW = 768, PH = 1060;
const rgb = (c, a = 1) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function rand(seed) { let s = seed; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }

const LINES = {
  'Golden hour': ['The light is still warm enough to read by.', 'Somewhere a window is being opened for the evening.'],
  Dusk: ['The streetlamps hesitate, then agree.', 'Everyone walking home looks like they are carrying a secret.'],
  'Blue hour': ['For twenty minutes the whole city is the colour of ink.', 'This is the hour the library likes best.'],
  Lamplight: ['Only the lamps are awake now, and the readers under them.', 'Turn the page quietly; someone is asleep next door.'],
  Midnight: ['At midnight the story stops pretending.', 'Whatever was hiding in chapter one comes out to look at you.'],
  'The small hours': ['Nobody reads this late by accident.', 'The house creaks like a spine being opened.'],
  'First light': ['The sky starts to argue with the dark.', 'One more chapter, you promise, and mean it.'],
  Dawn: ['Thank you for reading slowly.', 'The library is closing. It will open again at dusk.'],
};

/** The hours of a book's five spreads. */
export function spreadHours(book) {
  const h0 = hourOf(book.hour);
  return [h0, h0 + 0.85, h0 + 2.1, h0 + 3.6, 29.83].map((h, i, all) => (i < 4 ? Math.min(h, 29.2 - (3 - i) * 0.4) : h)).map((h, i, a) => (i && h <= a[i - 1] ? a[i - 1] + 0.35 : h));
}

export function paintCoverPage(book) {
  // the cloth cover with gilt lettering (Long Light-style), in the book's own colours
  const c = document.createElement('canvas'); c.width = PW; c.height = PH;
  const g = c.getContext('2d');
  g.fillStyle = book.sp; g.fillRect(0, 0, PW, PH);
  const r = rand(7);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.04})`; g.fillRect(r() * PW, r() * PH, 1.5, 1.5); }
  g.strokeStyle = book.ac; g.globalAlpha = 0.8; g.lineWidth = 2;
  g.strokeRect(46, 46, PW - 92, PH - 92); g.strokeRect(58, 58, PW - 116, PH - 116);
  g.globalAlpha = 1;
  // rising sun/moon emblem
  g.fillStyle = book.ac;
  g.beginPath(); g.arc(PW / 2, 330, 64, Math.PI, 0); g.fill();
  for (let i = 0; i < 13; i++) { const a = Math.PI + (i / 12) * Math.PI; g.fillRect(PW / 2 + Math.cos(a) * 82 - 2, 330 + Math.sin(a) * 82 - 14, 4, 28); }
  g.fillRect(PW / 2 - 110, 336, 220, 3);
  g.textAlign = 'center';
  g.font = "italic 500 74px 'Cormorant Garamond', serif";
  const words = book.t.split(' ');
  const lines = []; let line = '';
  for (const w of words) { if (g.measureText(line + ' ' + w).width > PW - 200 && line) { lines.push(line); line = w; } else line = (line + ' ' + w).trim(); }
  lines.push(line);
  lines.forEach((l, i) => g.fillText(l, PW / 2, 500 + i * 78));
  g.font = "600 20px Manrope, sans-serif";
  g.fillText(book.an.toUpperCase().split('').join(' '), PW / 2, 520 + lines.length * 78 + 30);
  g.font = "500 16px Manrope, sans-serif"; g.globalAlpha = 0.8;
  g.fillText(`FOLIO · THE NIGHT LIBRARY · NO. ${book.no}`, PW / 2, PH - 110);
  return c;
}

export function paintEndpaper(book) {
  const c = document.createElement('canvas'); c.width = PW; c.height = PH;
  const g = c.getContext('2d');
  g.fillStyle = book.sp; g.fillRect(0, 0, PW, PH);
  g.strokeStyle = book.ac; g.globalAlpha = 0.16; g.lineWidth = 1.4;
  for (let i = 0; i < 34; i++) { g.beginPath(); g.moveTo(0, i * 34); g.bezierCurveTo(260, i * 34 - 40, 520, i * 34 + 60, PW, i * 34); g.stroke(); }
  g.globalAlpha = 0.8; g.fillStyle = book.ink; g.textAlign = 'center';
  g.font = "italic 500 40px 'Cormorant Garamond', serif"; g.fillText('for the ones who read at night', PW / 2, PH / 2);
  return c;
}

function paperGrain(g) {
  const r = rand(3);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(90,70,40,${r() * 0.05})`; g.fillRect(r() * PW, r() * PH, 2, 2); }
}

/** Left page: paper-cut landscape for this hour. ox/oy in −1…1 shift the layers (parallax). */
export function paintScene(g, book, hour, ox = 0, oy = 0) {
  const n = nightAt(hour);
  g.fillStyle = '#F3ECDF'; g.fillRect(0, 0, PW, PH);
  const m = 54, iw = PW - m * 2, ih = PH - m * 2 - 70;
  g.save();
  g.beginPath(); g.roundRect(m, m, iw, ih, 6); g.clip();
  const sky = g.createLinearGradient(0, m, 0, m + ih);
  sky.addColorStop(0, rgb(n.skyTop)); sky.addColorStop(1, rgb(n.skyLow));
  g.fillStyle = sky; g.fillRect(m, m, iw, ih);
  // stars
  const r = rand(11);
  for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(255,255,255,${n.stars * (0.3 + r() * 0.7)})`; g.fillRect(m + r() * iw, m + r() * ih * 0.6, 2, 2); }
  // orb
  const ox0 = ox * -6, oy0 = oy * 4;
  const orbX = m + n.orb[0] * iw + ox0, orbY = m + ih * (0.62 - n.orb[1] * 0.5) + oy0;
  const glow = g.createRadialGradient(orbX, orbY, 0, orbX, orbY, 160);
  glow.addColorStop(0, n.sunUp ? 'rgba(255,220,160,.6)' : 'rgba(230,236,255,.35)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = glow; g.fillRect(m, m, iw, ih);
  g.fillStyle = n.sunUp ? '#FFE2B0' : '#F2F2EA';
  g.beginPath(); g.arc(orbX, orbY, 34, 0, Math.PI * 2); g.fill();
  if (!n.sunUp) { g.fillStyle = rgb(mix(n.skyTop, n.skyLow, 0.4)); g.beginPath(); g.arc(orbX + 14, orbY - 8, 30, 0, Math.PI * 2); g.fill(); }

  // four paper layers, far → near
  const ink = [0.09, 0.08, 0.1];
  const tint = [parseInt(book.ac.slice(1, 3), 16) / 255, parseInt(book.ac.slice(3, 5), 16) / 255, parseInt(book.ac.slice(5, 7), 16) / 255];
  const depth = [6, 14, 26, 42];
  for (let L = 0; L < 4; L++) {
    const t = (L + 1) / 5;
    const base = mix(mix(n.skyLow, ink, 0.35 + t * 0.5), tint, 0.08 + (L === 1 ? 0.06 : 0));
    const dx = ox * -depth[L], dy = oy * depth[L] * 0.4;
    const top = m + ih * (0.48 + L * 0.1) + dy;
    const rr = rand(L * 31 + book.no.charCodeAt(2));
    g.save();
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 16; g.shadowOffsetY = 6;
    g.fillStyle = rgb(base);
    g.beginPath(); g.moveTo(m - 60 + dx, m + ih + 10);
    const amp = 40 + L * 12, freq = 1.4 + L * 0.7;
    for (let x = -60; x <= iw + 60; x += 12) {
      const y = top + Math.sin((x / iw) * Math.PI * freq + L * 1.7) * amp * 0.5 + Math.sin((x / iw) * Math.PI * freq * 2.7 + L) * amp * 0.2;
      g.lineTo(m + x + dx, y);
    }
    g.lineTo(m + iw + 60 + dx, m + ih + 10); g.closePath(); g.fill();
    g.restore();
    // props per scene
    g.save();
    g.fillStyle = rgb(base);
    g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 10; g.shadowOffsetY = 4;
    const lampOn = n.lampI > 1;
    if (book.scene === 'city' && (L === 1 || L === 2)) {
      for (let i = 0; i < 9; i++) {
        const bx = m + 20 + i * (iw / 9) + dx + rr() * 20, bw = 40 + rr() * 30, bh = 80 + rr() * (L === 1 ? 160 : 110);
        const by = top - bh + 30;
        g.fillRect(bx, by, bw, bh + 200);
        if (lampOn) { g.save(); g.shadowBlur = 0; g.fillStyle = `rgba(255,200,120,${0.5 + rr() * 0.5})`; for (let w = 0; w < 6; w++) if (rr() > 0.45) g.fillRect(bx + 8 + (w % 2) * 18, by + 14 + Math.floor(w / 2) * 22, 8, 10); g.restore(); }
      }
    }
    if (book.scene === 'sea' && L === 2) {
      const lx = m + iw * 0.7 + dx, ly = top - 150;
      g.fillRect(lx, ly, 34, 190); g.beginPath(); g.moveTo(lx - 8, ly); g.lineTo(lx + 17, ly - 34); g.lineTo(lx + 42, ly); g.fill();
      if (lampOn) { g.save(); g.shadowBlur = 0; const beam = g.createLinearGradient(lx, ly, lx - 400, ly - 40); beam.addColorStop(0, 'rgba(255,230,170,.55)'); beam.addColorStop(1, 'rgba(255,230,170,0)'); g.fillStyle = beam; g.beginPath(); g.moveTo(lx + 10, ly - 14); g.lineTo(lx - 420, ly - 90); g.lineTo(lx - 420, ly + 30); g.fill(); g.restore(); }
    }
    if ((book.scene === 'orchard' || book.scene === 'valley') && L === 2) {
      for (let i = 0; i < 6; i++) { const tx = m + 40 + i * (iw / 6) + dx + rr() * 30, ty = top - 20 - rr() * 30, tr = 26 + rr() * 22; g.fillRect(tx - 3, ty, 6, 60); g.beginPath(); g.arc(tx, ty, tr, 0, Math.PI * 2); g.fill(); }
      if (book.scene === 'valley' && lampOn) { g.save(); g.shadowBlur = 0; g.fillStyle = 'rgba(255,200,120,.9)'; g.fillRect(m + iw * 0.3 + dx, top + 18, 10, 10); g.fillRect(m + iw * 0.62 + dx, top + 30, 10, 10); g.restore(); }
    }
    if (book.scene === 'road' && L === 3) {
      g.save(); g.shadowBlur = 0; g.strokeStyle = rgb(mix(base, [1, 1, 1], 0.3)); g.lineWidth = 16; g.beginPath(); g.moveTo(m + iw * 0.5 + dx, m + ih + 10); g.bezierCurveTo(m + iw * 0.2 + dx, top + 60, m + iw * 0.8 + dx, top + 30, m + iw * 0.55 + dx, top - 10); g.stroke(); g.restore();
    }
    if (book.scene === 'sky' && L === 0) {
      g.save(); g.shadowBlur = 20; g.shadowColor = 'rgba(255,190,110,.8)'; g.shadowOffsetY = 0;
      for (let i = 0; i < 12; i++) { const lx = m + rr() * iw + dx * 0.5, ly = m + 60 + rr() * ih * 0.4 + dy; g.fillStyle = `rgba(255,${180 + rr() * 40},110,${0.6 + rr() * 0.4})`; g.beginPath(); g.ellipse(lx, ly, 7, 10, 0, 0, Math.PI * 2); g.fill(); }
      g.restore();
    }
    g.restore();
  }
  g.restore();
  // caption under the picture
  g.fillStyle = '#6B5A44'; g.textAlign = 'left';
  g.font = "italic 500 26px 'Cormorant Garamond', serif";
  g.fillText(`${clockOf(hour)} — ${n.name.toLowerCase()} over ${book.scene === 'sea' ? 'the coast' : book.scene === 'city' ? 'the city' : book.scene === 'road' ? 'the road' : book.scene === 'sky' ? 'the rooftops' : 'the valley'}`, m, PH - m - 14);
  paperGrain(g);
  const gut = g.createLinearGradient(PW, 0, PW - 90, 0);
  gut.addColorStop(0, 'rgba(70,50,20,.28)'); gut.addColorStop(1, 'rgba(70,50,20,0)');
  g.fillStyle = gut; g.fillRect(0, 0, PW, PH);
}

/** Right page: the hour, the chapter, a little text. */
export function paintText(g, book, hour, idx, total) {
  const n = nightAt(hour);
  const end = idx === total - 1;
  g.fillStyle = '#F3ECDF'; g.fillRect(0, 0, PW, PH);
  paperGrain(g);
  const gut = g.createLinearGradient(0, 0, 90, 0);
  gut.addColorStop(0, 'rgba(70,50,20,.28)'); gut.addColorStop(1, 'rgba(70,50,20,0)');
  g.fillStyle = gut; g.fillRect(0, 0, PW, PH);
  const m = 84;
  g.fillStyle = '#8A6A3A'; g.textAlign = 'left';
  g.font = "600 17px Manrope, sans-serif";
  g.fillText((end ? 'THE LAST PAGE' : `CHAPTER ${['I', 'II', 'III', 'IV', 'V', 'VI'][idx]}`) + ' · ' + n.name.toUpperCase(), m, m + 10);
  g.fillStyle = '#2A2118';
  if (end) {
    g.font = "italic 500 86px 'Cormorant Garamond', serif";
    g.fillText('Thank you', m, 300); g.fillText('for reading', m, 384); g.fillText('slowly.', m, 468);
    g.font = "500 30px 'Cormorant Garamond', serif"; g.fillStyle = '#4B3F33';
    ['You read through the night with 1,204 others.', 'The library closes at dawn and opens again', 'at dusk. Your page is saved.'].forEach((l, i) => g.fillText(l, m, 560 + i * 44));
  } else {
    g.font = "500 168px 'Cormorant Garamond', serif";
    g.fillText(clockOf(hour), m - 8, 260);
    g.font = "italic 500 46px 'Cormorant Garamond', serif";
    g.fillStyle = '#5A4A38';
    g.fillText(book.chapters[idx] || '', m, 330);
    g.fillStyle = '#2A2118';
    g.font = "500 31px 'Cormorant Garamond', serif";
    const text = idx === 0 ? `${book.l1} ${book.l2 && book.l2 !== book.blurb ? book.l2 : ''}` : (LINES[n.name] || LINES.Midnight).join(' ') + ' ' + book.hook;
    const words = text.split(' '); let line = '', y = 430;
    for (const w of words) { if (g.measureText(line + ' ' + w).width > PW - m * 2 && line) { g.fillText(line, m, y); y += 46; line = w; if (y > PH - 170) break; } else line = (line + ' ' + w).trim(); }
    if (y <= PH - 170) g.fillText(line, m, y);
  }
  g.fillStyle = '#8A6A3A'; g.font = "600 16px Manrope, sans-serif";
  g.fillText(`p. ${1 + idx * 2}`, m, PH - 70);
  g.textAlign = 'right';
  g.fillText(`${idx + 1} / ${total}`, PW - m, PH - 70);
}
