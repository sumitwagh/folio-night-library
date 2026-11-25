// One cover design painted two ways: CSS (DOM books) and Canvas 2D (WebGL textures).
// Books use the catalogue fields: t (title), an (author), g (genre), bg/ac/ink/sp colours, motif.
const norm = (b) => ({ title: b.t, author: b.an, genre: b.g, bg: b.bg, accent: b.ac, ink: b.ink, spine: b.sp, motif: b.motif });

/** CSS declarations for the motif layer of a DOM cover. */
export function motifCSS(bk) {
  const b = norm(bk);
  const a = b.accent;
  switch (b.motif) {
    case 'sun': return `width:80%;height:54%;border-radius:50%;top:-10%;right:-24%;background:${a}`;
    case 'band': return `width:100%;height:6%;left:0;top:58%;background:${a}`;
    case 'arch': return `width:84%;height:60%;border-radius:999px 999px 0 0;left:8%;bottom:0;background:${a}`;
    case 'disc': return `width:46%;height:31%;border-radius:50%;left:27%;top:34%;background:${a}`;
    case 'line': return `width:2px;height:70%;left:62%;top:15%;background:${a}`;
    case 'diamond': return `width:56%;height:37%;border:2px solid ${a};left:22%;top:28%;transform:rotate(45deg)`;
    case 'moon': return `width:46%;height:31%;border-radius:50%;right:10%;top:12%;background:transparent;box-shadow:inset -18px 10px 0 0 ${a}`;
    case 'tide': return `width:130%;height:90%;border-radius:50%;left:-60%;bottom:-48%;background:${a}`;
    case 'grid': return `inset:0;background:repeating-linear-gradient(90deg,transparent 0 23%,${a}33 23% calc(23% + 1px)),repeating-linear-gradient(0deg,transparent 0 15%,${a}33 15% calc(15% + 1px))`;
    case 'rings': return `width:120%;height:80%;left:-10%;top:10%;border-radius:50%;background:repeating-radial-gradient(circle,transparent 0 9px,${a} 9px 10px)`;
    default: return '';
  }
}

/** A ready-to-use HTML string for a 3D DOM book (used by templates through bindings). */
export function coverVars(bk) {
  const b = norm(bk);
  return `--bg:${b.bg};--ac:${b.accent};--ci:${b.ink};--sp:${b.spine}`;
}

function wrap(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** Paint a cover onto a canvas (default 512×768). Returns the canvas. */
export function paintCover(bk, { w = 512, h = 768, canvas } = {}) {
  const b = norm(bk);
  const c = canvas || document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const s = w / 512;
  g.fillStyle = b.bg; g.fillRect(0, 0, w, h);
  g.save();
  g.fillStyle = b.accent; g.strokeStyle = b.accent;
  switch (b.motif) {
    case 'sun': g.beginPath(); g.ellipse(w * 0.84, h * 0.17, w * 0.4, h * 0.27, 0, 0, Math.PI * 2); g.fill(); break;
    case 'band': g.fillRect(0, h * 0.58, w, h * 0.06); break;
    case 'arch': g.beginPath(); g.moveTo(w * 0.08, h); g.lineTo(w * 0.08, h * 0.4 + w * 0.42); g.arc(w * 0.5, h * 0.4 + w * 0.42, w * 0.42, Math.PI, 0); g.lineTo(w * 0.92, h); g.fill(); break;
    case 'disc': g.beginPath(); g.ellipse(w * 0.5, h * 0.495, w * 0.23, h * 0.155, 0, 0, Math.PI * 2); g.fill(); break;
    case 'line': g.fillRect(w * 0.62, h * 0.15, 3 * s, h * 0.7); break;
    case 'diamond': g.lineWidth = 4 * s; g.translate(w * 0.5, h * 0.465); g.rotate(Math.PI / 4); g.strokeRect(-w * 0.2, -w * 0.2, w * 0.4, w * 0.4); break;
    case 'moon': g.beginPath(); g.arc(w * 0.66, h * 0.27, w * 0.18, 0, Math.PI * 2); g.fill(); g.fillStyle = b.bg; g.beginPath(); g.arc(w * 0.61, h * 0.25, w * 0.165, 0, Math.PI * 2); g.fill(); break;
    case 'tide': g.beginPath(); g.ellipse(w * 0.05, h * 1.03, w * 0.85, h * 0.45, 0, 0, Math.PI * 2); g.fill(); break;
    case 'grid': g.globalAlpha = 0.25; g.lineWidth = 1.5 * s; for (let x = w * 0.23; x < w; x += w * 0.23) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = h * 0.15; y < h; y += h * 0.15) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } break;
    case 'rings': g.lineWidth = 2 * s; for (let r = 12 * s; r < w * 0.7; r += 20 * s) { g.beginPath(); g.ellipse(w * 0.5, h * 0.5, r, r * 0.66, 0, 0, Math.PI * 2); g.stroke(); } break;
  }
  g.restore();
  // type — weighted and shadowed so it stays readable on a 3D cover at any hour
  const pad = w * 0.12;
  const lum = (hx) => { const n = parseInt(hx.slice(1), 16); return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; };
  const lightInk = lum(b.ink) > 0.5;
  const scrim = g.createLinearGradient(0, h * 0.5, 0, h);
  scrim.addColorStop(0, b.bg + '00'); scrim.addColorStop(0.55, b.bg + 'B3'); scrim.addColorStop(1, b.bg + 'E6');
  g.fillStyle = scrim; g.fillRect(0, h * 0.5, w, h * 0.5);
  g.shadowColor = lightInk ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.45)';
  g.shadowBlur = 10 * s;
  g.fillStyle = b.ink;
  g.font = `700 ${Math.round(17 * s)}px Manrope, sans-serif`;
  g.fillText(b.genre.toUpperCase().split('').join(String.fromCharCode(8202)), pad, pad + 12 * s);
  const size = Math.round((b.title.length > 24 ? 70 : 84) * s);
  g.font = `600 ${size}px 'Cormorant Garamond', serif`;
  const lines = wrap(g, b.title, w - pad * 2);
  const lh = size * 0.92;
  const top = h - pad - 40 * s - lh * (lines.length - 1);
  lines.forEach((l, i) => g.fillText(l, pad, top + i * lh));
  g.font = `700 ${Math.round(18 * s)}px Manrope, sans-serif`;
  g.fillText(b.author.toUpperCase(), pad, h - pad + 4 * s);
  g.shadowBlur = 0; g.shadowColor = 'transparent';
  // spine shading + sheen
  const sh = g.createLinearGradient(0, 0, w, 0);
  sh.addColorStop(0, 'rgba(0,0,0,.35)'); sh.addColorStop(0.05, 'rgba(255,255,255,.12)'); sh.addColorStop(0.09, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.18)');
  g.fillStyle = sh; g.fillRect(0, 0, w, h);
  return c;
}

/** Paint a spine: catalogue number, vertical title, author, imprint mark. */
export function paintSpine(bk, { w = 96, h = 768 } = {}) {
  const b = norm(bk);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = b.spine; g.fillRect(0, 0, w, h);
  const sh = g.createLinearGradient(0, 0, w, 0);
  sh.addColorStop(0, 'rgba(0,0,0,.28)'); sh.addColorStop(0.35, 'rgba(255,255,255,.10)'); sh.addColorStop(1, 'rgba(0,0,0,.25)');
  g.fillStyle = sh; g.fillRect(0, 0, w, h);
  g.fillStyle = b.accent; g.fillRect(0, h * 0.045, w, 3); g.fillRect(0, h * 0.86, w, 3);
  g.fillStyle = b.ink; g.globalAlpha = 0.8;
  g.font = `600 ${Math.round(w * 0.17)}px Manrope, sans-serif`; g.textAlign = 'center';
  g.fillText(bk.no || '', w / 2, h * 0.035);
  g.globalAlpha = 1;
  g.save(); g.translate(w / 2 + w * 0.14, h * 0.46); g.rotate(Math.PI / 2);
  g.fillStyle = b.ink; g.textAlign = 'center';
  let size = Math.round(w * 0.42);
  g.font = `500 ${size}px 'Cormorant Garamond', serif`;
  while (g.measureText(b.title).width > h * 0.72 && size > 10) { size -= 1; g.font = `500 ${size}px 'Cormorant Garamond', serif`; }
  g.fillText(b.title, 0, 0);
  g.restore();
  g.fillStyle = b.accent; g.beginPath(); g.arc(w / 2, h * 0.93, w * 0.16, Math.PI, 0); g.fill();
  return c;
}
