// The reading table: a book lies on linen in moonlight/lamplight. It opens, and you turn its
// pages by dragging them (or with arrows). Pages curl with a little gravity.
import { THREE, canvasTex } from './stage.js';
import { PW, PH, paintScene, paintText, paintCoverPage, paintEndpaper, spreadHours } from './pages.js';

const W = 2.9, H = W * (PH / PW), NX = 26, NZ = 2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const TABLE_FRAG = /* glsl */ `
uniform float uTime; uniform vec3 uKey, uLamp, uCloth; uniform float uKeyI, uLampI; uniform vec4 uBook;
varying vec2 vUv; varying vec3 vPos;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.1; a*=.5; } return v; }
void main(){
  vec2 p = vPos.xz;
  // linen weave
  float weave = .5 + .5 * sin(p.x * 260.) * sin(p.y * 260.);
  float fib = fbm(p * vec2(3., 40.)) * .5 + fbm(p * vec2(40., 3.)) * .5;
  vec3 cloth = uCloth * (.86 + weave * .05 + fib * .16);
  // dappled light: window panes + leaves drifting
  vec2 w = p * .32 + vec2(.3, .1);
  float panes = smoothstep(.04, .07, abs(fract(w.x * 1.6) - .5)) * smoothstep(.04, .07, abs(fract(w.y * 1.1) - .5));
  float leaves = smoothstep(.38, .62, fbm(p * .9 + vec2(uTime * .03, uTime * .02)));
  float window = smoothstep(4.5, 1.0, length((p - vec2(-1.5, -1.8)) * vec2(.6, .9)));
  float dapple = panes * mix(.35, 1., leaves) * window;
  vec3 col = cloth * (.18 + uKeyI * .32) + cloth * uKey * dapple * uKeyI * .55;
  // lamp pool
  col += cloth * uLamp * uLampI * .32 * exp(-length(p - vec2(2.6, -1.4)) * .55);
  // soft shadow under the book
  vec2 b = (p - uBook.xy) / uBook.zw;
  float sh = smoothstep(1.25, .7, max(abs(b.x), abs(b.y) * 1.0));
  col *= 1. - sh * .45;
  // vignette
  col *= smoothstep(13., 3., length(p));
  gl_FragColor = vec4(col, 1.);
  #include <colorspace_fragment>
}`;

export class Reader {
  constructor(stage) {
    this.stage = stage;
    this.group = new THREE.Group();
    this.group.visible = false;
    stage.scene.add(this.group);
    this.tableU = { uTime: { value: 0 }, uKey: { value: new THREE.Color() }, uLamp: { value: new THREE.Color(1, 0.72, 0.4) }, uCloth: { value: new THREE.Color('#E6D9C2') }, uKeyI: { value: 1 }, uLampI: { value: 1 }, uBook: { value: new THREE.Vector4(0, 0, 3.4, 2.6) } };
    const table = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShaderMaterial({
      uniforms: this.tableU,
      vertexShader: 'varying vec2 vUv; varying vec3 vPos; void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position,1.); vPos = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }',
      fragmentShader: TABLE_FRAG,
    }));
    table.rotation.x = -Math.PI / 2;
    this.group.add(table);

    this.book = new THREE.Group();
    this.group.add(this.book);
    const cloth = new THREE.MeshStandardMaterial({ color: 0x1d2540, roughness: 0.85 });
    this.cloth = cloth;
    const boardGeo = new THREE.BoxGeometry(W + 0.12, 0.06, H + 0.16);
    this.boardL = new THREE.Mesh(boardGeo, cloth); this.boardL.position.set(-W / 2 - 0.04, 0.03, 0);
    this.boardR = new THREE.Mesh(boardGeo, cloth); this.boardR.position.set(W / 2 + 0.04, 0.03, 0);
    const edgeC = document.createElement('canvas'); edgeC.width = 8; edgeC.height = 64;
    const eg = edgeC.getContext('2d'); for (let y = 0; y < 64; y += 2) { eg.fillStyle = y % 4 ? '#efe6d4' : '#d4c7ae'; eg.fillRect(0, y, 8, 2); }
    const edgeMat = new THREE.MeshStandardMaterial({ map: canvasTex(edgeC), roughness: 0.9 });
    const paper = new THREE.MeshStandardMaterial({ color: 0xf3ecdf, roughness: 0.95 });
    this.blockR = new THREE.Mesh(new THREE.BoxGeometry(W, 0.16, H), [edgeMat, edgeMat, paper, paper, edgeMat, edgeMat]);
    this.blockR.position.set(W / 2, 0.14, 0);
    this.blockL = new THREE.Mesh(new THREE.BoxGeometry(W, 0.12, H), [edgeMat, edgeMat, paper, paper, edgeMat, edgeMat]);
    this.blockL.position.set(-W / 2, 0.12, 0);
    this.book.add(this.boardL, this.boardR, this.blockR, this.blockL);
    [this.boardL, this.boardR, this.blockR, this.blockL].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });

    // canvases: two base pages + the two faces of the turning leaf
    this.cv = {};
    ['left', 'right', 'front', 'back'].forEach((k) => {
      const c = document.createElement('canvas'); c.width = PW; c.height = PH;
      this.cv[k] = { c, g: c.getContext('2d'), t: canvasTex(c) };
    });
    this.cv.back.t.wrapS = THREE.RepeatWrapping; this.cv.back.t.repeat.x = -1; this.cv.back.t.offset.x = 1;
    this.cv.left.t.wrapS = THREE.RepeatWrapping;

    this.baseL = this.pageMesh(this.cv.left.t, THREE.FrontSide, -1);
    this.baseR = this.pageMesh(this.cv.right.t, THREE.FrontSide, 1);
    this.leafGeo = this.pageGeometry();
    this.leafF = new THREE.Mesh(this.leafGeo, new THREE.MeshStandardMaterial({ map: this.cv.front.t, roughness: 0.92, side: THREE.FrontSide }));
    this.leafB = new THREE.Mesh(this.leafGeo, new THREE.MeshStandardMaterial({ map: this.cv.back.t, roughness: 0.92, side: THREE.BackSide }));
    this.leafF.castShadow = true;
    this.book.add(this.baseL.mesh, this.baseR.mesh, this.leafF, this.leafB);

    this.at = -1; this.flip = null; this.openT = 0; this.drag = null;
    this.ptr = { x: 0, y: 0 }; this._last = '';
    stage.frames.add((dt, t) => this.tick(dt, t));
  }

  pageGeometry() {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array((NX + 1) * (NZ + 1) * 3), uv = new Float32Array((NX + 1) * (NZ + 1) * 2), idx = [];
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const k = j * (NX + 1) + i; uv[k * 2] = i / NX; uv[k * 2 + 1] = 1 - j / NZ; }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  }

  /** Lay a page along the spine: theta 0 = flat on the right, PI = flat on the left. */
  bend(geo, theta, lift = 0, yBase = 0.23) {
    const pos = geo.attributes.position.array;
    const seg = W / NX;
    const k = Math.sin(theta) * 0.9;
    const xs = [0], ys = [0];
    for (let i = 1; i <= NX; i++) {
      const f = i / NX;
      let a = theta - k * Math.pow(f, 1.4) + (theta > Math.PI / 2 ? k * 0.35 * f : 0);
      a = clamp(a, 0, Math.PI);
      xs.push(xs[i - 1] + seg * Math.cos(a));
      ys.push(ys[i - 1] + seg * Math.sin(a));
    }
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
      const p = (j * (NX + 1) + i) * 3;
      const f = i / NX;
      const rest = 0.09 * Math.pow(1 - f, 2.2) * (1 - Math.sin(theta));
      pos[p] = xs[i]; pos[p + 1] = yBase + ys[i] + rest + lift; pos[p + 2] = -H / 2 + (j / NZ) * H;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
  }

  pageMesh(tex, side, dir) {
    const geo = this.pageGeometry();
    this.bend(geo, dir > 0 ? 0 : Math.PI, 0, dir > 0 ? 0.225 : 0.185);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, side: dir > 0 ? THREE.FrontSide : THREE.BackSide });
    if (dir < 0) { tex.repeat.x = -1; tex.offset.x = 1; }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    return { geo, mesh };
  }

  /** Load a book (closed, on the table). */
  load(book) {
    this.bookData = book;
    this.hours = spreadHours(book);
    this.at = -1; this.flip = null; this.openT = 0;
    this.cover = paintCoverPage(book);
    this.endpaper = paintEndpaper(book);
    this.cloth.color.set(book.sp);
    this.paintState();
  }

  /** Paint what each base page shows for the current spread. */
  paintState() {
    const b = this.bookData;
    const N = this.hours.length;
    if (this.at >= 0) { paintScene(this.cv.left.g, b, this.hours[this.at], this.ptr.x, this.ptr.y); this.cv.left.t.needsUpdate = true; }
    const ri = Math.max(0, this.at);
    paintText(this.cv.right.g, b, this.hours[ri], ri, N); this.cv.right.t.needsUpdate = true;
    if (this.at < 0) { this.cv.front.g.drawImage(this.cover, 0, 0); this.cv.front.t.needsUpdate = true; this.cv.back.g.drawImage(this.endpaper, 0, 0); this.cv.back.t.needsUpdate = true; }
  }

  canNext() { return this.at < this.hours.length - 1; }
  canPrev() { return this.at > -1; }

  /** Begin a turn. dir +1 forward, −1 back. Returns false if not possible. */
  begin(dir) {
    if (this.flip) return false;
    const b = this.bookData, N = this.hours.length;
    if (dir > 0 && !this.canNext()) return false;
    if (dir < 0 && !this.canPrev()) return false;
    const from = this.at, to = from + dir;
    if (dir > 0) {
      // leaf: front = current right page (or the cover), back = next left page
      if (from < 0) this.cv.front.g.drawImage(this.cover, 0, 0);
      else this.cv.front.g.drawImage(this.cv.right.c, 0, 0);
      paintScene(this.cv.back.g, b, this.hours[to], 0, 0);
      paintText(this.cv.right.g, b, this.hours[to], to, N);
    } else {
      // leaf starts on the left: its visible (back) face = current left page; front = previous right
      this.cv.back.g.drawImage(this.cv.left.c, 0, 0);
      if (to < 0) this.cv.front.g.drawImage(this.cover, 0, 0); else paintText(this.cv.front.g, b, this.hours[to], to, N);
      if (to >= 0) paintScene(this.cv.left.g, b, this.hours[to], this.ptr.x, this.ptr.y);
    }
    ['front', 'back', 'left', 'right'].forEach((k) => { this.cv[k].t.needsUpdate = true; });
    this.flip = { dir, from, to, p: 0, target: null, auto: true };
    return true;
  }

  go(dir) { if (this.begin(dir)) this.flip.target = 1; }

  /** Drag support: pointer x in px since press, page width in px. */
  dragStart(side) { const dir = side > 0 ? 1 : -1; if (this.begin(dir)) { this.flip.target = null; this.flip.auto = false; return true; } return false; }
  dragMove(frac) { if (this.flip && !this.flip.auto) this.flip.p = clamp(frac); }
  dragEnd(velocity = 0) { if (!this.flip) return; this.flip.auto = true; this.flip.target = this.flip.p > 0.35 || velocity > 0.6 ? 1 : 0; }

  finish(done) {
    const f = this.flip;
    this.flip = null;
    if (done) this.at = f.to;
    this.paintState();
    this.emitChange?.(this.at);
  }

  setPointer(x, y) { this.ptr.x = x; this.ptr.y = y; }

  tick(dt, t) {
    if (!this.group.visible) return;
    this.tableU.uTime.value = t;
    const k = this.stage.reduced ? 1 : 1 - Math.pow(0.004, dt);
    // flip animation
    if (this.flip && this.flip.target != null) {
      const sp = this.stage.reduced ? 1 : dt * 1.6;
      this.flip.p += Math.sign(this.flip.target - this.flip.p) * sp;
      if ((this.flip.target === 1 && this.flip.p >= 1) || (this.flip.target === 0 && this.flip.p <= 0)) this.finish(this.flip.target === 1);
    }
    const f = this.flip;
    const open = this.at >= 0 || (f && f.from < 0);
    // leaf angle
    let theta;
    if (f) { const pp = ease(clamp(f.p)); theta = f.dir > 0 ? pp * Math.PI : (1 - pp) * Math.PI; }
    else theta = this.at < 0 ? 0 : Math.PI;
    const showLeaf = !!f || this.at < 0;
    this.leafF.visible = this.leafB.visible = showLeaf;
    if (showLeaf) this.bend(this.leafGeo, theta, f ? 0.02 : 0, 0.24);
    // closed → open: slide the book so the spread is centred
    const openTarget = this.at >= 0 || (f && f.dir > 0 && f.from < 0) ? 1 : (f && f.dir < 0 && f.to < 0 ? 0 : this.at >= 0 ? 1 : 0);
    const want = f && f.from < 0 && f.dir > 0 ? ease(clamp(f.p)) : f && f.to < 0 ? 1 - ease(clamp(f.p)) : openTarget;
    this.openT += (want - this.openT) * k;
    this.book.position.x = -W / 2 * (1 - this.openT);
    const showLeft = this.at >= 0 || (f && f.to >= 0 && f.dir < 0) || (f && f.dir > 0 && f.p > 0.5);
    this.baseL.mesh.visible = this.at >= 0 || (f && f.dir < 0 && f.to >= 0);
    this.blockL.visible = this.boardL.visible = showLeft || this.openT > 0.02;
    this.tableU.uBook.value.set(0, 0, (W / 2) * (1 + this.openT) + 0.15, H / 2 + 0.14);
    void open;
    // paper-cut parallax on the left page
    const key = `${this.at}|${this.ptr.x.toFixed(2)}|${this.ptr.y.toFixed(2)}`;
    if (!f && this.at >= 0 && key !== this._last && !this.stage.reduced) {
      this._last = key;
      paintScene(this.cv.left.g, this.bookData, this.hours[this.at], this.ptr.x, this.ptr.y);
      this.cv.left.t.needsUpdate = true;
    }
  }

  /** Screen x of the spine, and page width in px (for dragging). */
  metrics() {
    const s = this.stage;
    const a = s.project(new THREE.Vector3(this.book.position.x, 0.2, 0));
    const b = s.project(new THREE.Vector3(this.book.position.x + W, 0.2, 0));
    const top = s.project(new THREE.Vector3(0, 0.2, -H / 2)), bot = s.project(new THREE.Vector3(0, 0.2, H / 2));
    return { spine: a.x, page: Math.abs(b.x - a.x), top: top.y, bottom: bot.y };
  }

  setNight(n) {
    this.tableU.uKey.value.setRGB(...n.key, THREE.SRGBColorSpace);
    this.tableU.uKeyI.value = n.keyI;
    this.tableU.uLampI.value = n.lampI / 2;
  }
}
