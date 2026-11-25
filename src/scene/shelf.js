// The shelf: a curved row of books standing on a turning platter. Spines face you; the book in
// the centre turns to show its cover. Drag, use the clock, or click a spine to turn it.
import { THREE, canvasTex } from './stage.js';
import { paintCover, paintSpine } from '../covers.js';

const W = 2.05, H = 3.0, T = 0.44, R = 15;
const STEP = (T + 0.07) / R;
const GAP = (W / 2 + T * 0.9) / R;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

function edgeTexture() {
  const c = document.createElement('canvas'); c.width = 16; c.height = 256;
  const g = c.getContext('2d');
  for (let y = 0; y < 256; y += 2) { g.fillStyle = y % 4 ? '#efe6d4' : '#d4c7ae'; g.fillRect(0, y, 16, 2); }
  return canvasTex(c);
}

function grooveTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#4A3C30'; g.fillRect(0, 0, 1024, 1024);
  for (let r = 40; r < 512; r += 3) {
    g.strokeStyle = `rgba(255,240,220,${0.03 + (r % 9 === 0 ? 0.05 : 0)})`;
    g.beginPath(); g.arc(512, 512, r, 0, Math.PI * 2); g.stroke();
  }
  const sh = g.createConicGradient(0, 512, 512);
  sh.addColorStop(0, 'rgba(255,255,255,.08)'); sh.addColorStop(0.12, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,255,255,.06)'); sh.addColorStop(0.62, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(255,255,255,.08)');
  g.fillStyle = sh; g.fillRect(0, 0, 1024, 1024);
  return canvasTex(c);
}

export class Shelf {
  constructor(stage, books) {
    this.stage = stage;
    this.group = new THREE.Group();
    stage.scene.add(this.group);
    this.f = 0; this.target = 0; this.count = books.length;
    this.hover = -1; this.leave = 0; this.visible = 1;
    this.listeners = { focus: [], open: [], hover: [] };

    // platter
    const platter = new THREE.Mesh(new THREE.CylinderGeometry(R + 1.0, R + 1.0, 0.22, 160, 1),
      [new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 0.4, metalness: 0.4 }), new THREE.MeshStandardMaterial({ map: grooveTexture(), roughness: 0.45, metalness: 0.15 }), new THREE.MeshStandardMaterial({ color: 0x1a1511 })]);
    platter.position.set(0, -1.62, -R);
    platter.receiveShadow = true;
    this.platter = platter;
    // brass rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R + 1.0, 0.05, 8, 200), new THREE.MeshStandardMaterial({ color: 0xc9a46a, metalness: 0.9, roughness: 0.3 }));
    rim.rotation.x = Math.PI / 2; rim.position.set(0, -1.5, -R);
    this.group.add(platter, rim);

    const edge = edgeTexture();
    const edgeMat = new THREE.MeshStandardMaterial({ map: edge, roughness: 0.9 });
    const geo = new THREE.BoxGeometry(W, H, T);
    this.items = books.map((b, i) => {
      const ctex = canvasTex(paintCover(b, { w: 768, h: 1152 }));
      ctex.generateMipmaps = true;
      const cover = new THREE.MeshStandardMaterial({ map: ctex, roughness: 0.6, emissive: 0xffffff, emissiveMap: ctex, emissiveIntensity: 0.32 });
      const stex = canvasTex(paintSpine(b, { w: 128, h: 1024 }));
      const spine = new THREE.MeshStandardMaterial({ map: stex, roughness: 0.55, emissive: 0xffffff, emissiveMap: stex, emissiveIntensity: 0.22 });
      const back = new THREE.MeshStandardMaterial({ color: b.sp, roughness: 0.7 });
      const m = new THREE.Mesh(geo, [edgeMat, spine, edgeMat, edgeMat, cover, back]);
      m.castShadow = true; m.receiveShadow = true;
      m.userData = { book: b, index: i, slot: i, show: 1, s: 1, lift: 0 };
      this.group.add(m);
      return m;
    });

    this.ray = new THREE.Raycaster();
    this.ndc = new THREE.Vector2(-9, -9);
    stage.frames.add((dt) => this.tick(dt));
  }

  on(e, f) { this.listeners[e].push(f); }
  emit(e, v) { this.listeners[e].forEach((f) => f(v)); }

  /** Show only these ids, in shelf order. */
  filter(ids) {
    const at = new Map(ids.map((id, i) => [id, i]));
    this.items.forEach((m) => { const k = at.get(m.userData.book.id); m.userData.show = k == null ? 0 : 1; if (k != null) m.userData.slot = k; });
    this.count = ids.length;
    this.target = Math.min(this.target, Math.max(0, this.count - 1));
  }

  focusId(id) { const m = this.items.find((x) => x.userData.book.id === id); if (m && m.userData.show) this.target = m.userData.slot; }
  focused() { const k = Math.round(this.target); return this.items.find((m) => m.userData.show && m.userData.slot === k)?.userData.book; }

  pointer(x, y) { this.ndc.set(x, y); }

  click() {
    if (this.hover < 0) return false;
    const m = this.items[this.hover];
    if (m.userData.slot === Math.round(this.target)) this.emit('open', m.userData.book);
    else { this.target = m.userData.slot; this.emit('focus', m.userData.book); }
    return true;
  }

  tick(dt) {
    const k = this.stage.reduced ? 1 : 1 - Math.pow(0.0025, dt);
    this.target = Math.max(0, Math.min(this.count - 1, this.target));
    this.f = lerp(this.f, this.target, k);
    this.platter.rotation.y = -this.f * STEP * 1.0;
    this.group.visible = this.visible > 0.01;

    // hover
    let hit = -1;
    if (this.visible > 0.9 && this.leave < 0.05 && this.ndc.x > -2) {
      this.ray.setFromCamera(this.ndc, this.stage.camera);
      const hits = this.ray.intersectObjects(this.items.filter((m) => m.visible), false);
      if (hits.length) hit = hits[0].object.userData.index;
    }
    if (hit !== this.hover) { this.hover = hit; this.emit('hover', hit >= 0 ? this.items[hit].userData.book : null); }

    const fk = Math.round(this.target);
    for (const m of this.items) {
      const u = m.userData;
      u.s = lerp(u.s, u.show, k);
      const d = u.slot - this.f;
      const ad = Math.abs(d), sg = Math.sign(d) || 1;
      const a = sg * (Math.min(ad, 1) * GAP + Math.max(ad - 1, 0) * STEP);
      const ft = smooth(Math.max(0, 1 - ad));
      const isFocus = u.slot === fk;
      u.lift = lerp(u.lift, u.index === this.hover && !isFocus ? 1 : 0, k);
      const lv = isFocus ? this.leave : 0;
      const pull = ft * 0.7 + lv * 3.2;
      m.position.set(Math.sin(a) * (R + pull), -1.5 + H / 2 + u.lift * 0.28 + lv * 1.0 - (1 - u.s) * 3.4, Math.cos(a) * (R + pull) - R);
      m.rotation.set(-lv * 0.5, a + (Math.PI / 2) * (1 - ft) - lv * 0.6, u.lift * -0.06 * sg);
      m.scale.setScalar(Math.max(0.001, u.s));
      m.visible = u.s > 0.02 && Math.abs(a) < 0.95;
    }
  }
}
