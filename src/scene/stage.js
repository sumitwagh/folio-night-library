// One WebGL canvas behind the whole app: a plaster room with an arched window onto the night
// sky (drawn by a shader so it can change continuously with the hour), lights that follow the
// clock, and a render loop that sets (shelf, reading table) plug into.
import * as THREE from 'three';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const BG_FRAG = /* glsl */ `
precision highp float;
uniform vec2 uRes; uniform float uTime;
uniform vec3 uWall, uSkyTop, uSkyLow; uniform float uStars, uSunUp, uLamp, uDim;
uniform vec2 uOrb; uniform float uArchY;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 q = vec2((uv.x - .5) * asp, uv.y);
  // plaster wall
  float pl = fbm(q * 6.0) * .06 + fbm(q * 40.0) * .03;
  vec3 col = uWall * (0.9 + pl) * mix(1.06, .78, uv.y);
  // arched window: width .56 (in height units), from uArchY to .94
  float hw = min(.3, .36 * asp);
  float top = .94 - hw;
  vec2 a = vec2(q.x, uv.y);
  float inRect = step(abs(a.x), hw) * step(uArchY, a.y) * step(a.y, top);
  float inArc = step(length(vec2(a.x, a.y - top)), hw) * step(top, a.y);
  float win = max(inRect, inArc);
  // reveal (depth of the wall around the window)
  float hw2 = hw + .028;
  float inRect2 = step(abs(a.x), hw2) * step(uArchY - .028, a.y) * step(a.y, top);
  float inArc2 = step(length(vec2(a.x, a.y - top)), hw2) * step(top, a.y);
  float reveal = max(inRect2, inArc2) - win;
  col = mix(col, uWall * .72, reveal * .9);
  // the sky
  float sy = clamp((a.y - uArchY) / (.94 - uArchY), 0., 1.);
  vec3 sky = mix(uSkyLow, uSkyTop, smoothstep(0., 1., sy));
  vec2 sp = floor(gl_FragCoord.xy / 2.0);
  float st = step(.9965, hash(sp)) * (.5 + .5 * sin(uTime * 2. + hash(sp + 3.) * 40.));
  sky += st * uStars * .9;
  // moon or sun
  vec2 orb = vec2((uOrb.x - .5) * 2. * hw, uArchY + uOrb.y * (.94 - uArchY));
  float d = length(a - orb);
  float disc = smoothstep(.042, .038, d);
  vec3 orbCol = mix(vec3(.93,.94,1.), vec3(1.,.86,.62), uSunUp);
  float crescent = uSunUp > .5 ? 1. : smoothstep(.036, .042, length(a - orb - vec2(.016, .008)));
  sky = mix(sky, orbCol, disc * crescent);
  sky += orbCol * .22 * exp(-d * 14.);
  // distant hills in the window
  float hill = .02 + .05 * fbm(vec2(a.x * 3. + 2., 1.)) ;
  sky = mix(sky, uSkyLow * .45 + uWall * .1, step(sy, hill * 2.6) * .85);
  // mullions
  float mull = step(abs(a.x), .004) + step(abs(a.y - (uArchY + top) * .5 - .03), .003) * step(abs(a.x), hw);
  sky = mix(sky, uWall * .5, clamp(mull, 0., 1.));
  col = mix(col, sky, win);
  // window light spilling on the floor + lamp pool
  float spill = exp(-pow((q.x) / (hw * 1.6), 2.)) * smoothstep(.42, .0, uv.y) * .25;
  col += mix(uSkyTop, vec3(1.), .3) * spill * (1. - uLamp * .15);
  col += vec3(1., .72, .38) * uLamp * .16 * exp(-length(vec2(q.x, (uv.y - .22) * 1.6)) * 2.2);
  // floor band
  col *= mix(.82, 1., smoothstep(.12, .3, uv.y));
  // vignette
  col *= mix(1., .55, smoothstep(.45, 1.15, length(vec2(q.x / asp, uv.y - .5) * vec2(1.25, 1.4))));
  col *= uDim;
  gl_FragColor = vec4(col, 1.);
}`;

export class Stage {
  static supported() {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
  }

  constructor(host) {
    this.reduced = reduced();
    const small = innerWidth < 760;
    this.renderer = new THREE.WebGLRenderer({ antialias: !small, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.autoClear = false;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.host = host;

    // background
    this.bgScene = new THREE.Scene();
    this.bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.bgU = {
      uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uWall: { value: new THREE.Color() }, uSkyTop: { value: new THREE.Color() }, uSkyLow: { value: new THREE.Color() },
      uStars: { value: 0 }, uSunUp: { value: 0 }, uLamp: { value: 1 }, uOrb: { value: new THREE.Vector2(0.5, 0.5) }, uArchY: { value: 0.4 }, uDim: { value: 1 },
    };
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: this.bgU, vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: BG_FRAG, depthWrite: false }));
    this.bgScene.add(bg);

    // main scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
    this.camera.position.set(0, 1.2, 12);
    this.look = new THREE.Vector3(0, 0.4, 0);
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x221a14, 0.7);
    this.key = new THREE.DirectionalLight(0xffffff, 2);
    this.key.position.set(-4, 9, 6);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    Object.assign(this.key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 });
    this.key.shadow.bias = -0.0004;
    this.key.shadow.radius = 6;
    this.lamp = new THREE.PointLight(0xffb36b, 30, 16, 1.6);
    this.lamp.position.set(0, 3.4, 3);
    this.rim = new THREE.PointLight(0x9fb2ff, 10, 30, 1.6);
    this.rim.position.set(6, 4, -6);
    this.scene.add(this.hemi, this.key, this.key.target, this.lamp, this.rim);

    this.pointer = { x: 0, y: 0, sx: 0, sy: 0 };
    this.frames = new Set();
    addEventListener('pointermove', (e) => { this.pointer.x = (e.clientX / innerWidth) * 2 - 1; this.pointer.y = -(e.clientY / innerHeight) * 2 + 1; }, { passive: true });
    addEventListener('resize', () => this.resize());
    this.resize();
    this.clock = new THREE.Clock();
    const loop = () => {
      requestAnimationFrame(loop);
      if (document.hidden) { this.clock.getDelta(); return; }
      const dt = Math.min(this.clock.getDelta(), 0.05);
      const k = 1 - Math.pow(0.002, dt);
      this.pointer.sx += (this.pointer.x - this.pointer.sx) * k;
      this.pointer.sy += (this.pointer.y - this.pointer.sy) * k;
      this.bgU.uTime.value = this.clock.elapsedTime;
      for (const f of this.frames) f(dt, this.clock.elapsedTime);
      this.camera.lookAt(this.look);
      this.renderer.clear();
      this.renderer.render(this.bgScene, this.bgCam);
      this.renderer.clearDepth();
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const pr = this.renderer.getPixelRatio();
    this.bgU.uRes.value.set(w * pr, h * pr);
    this.size = { w, h };
  }

  /** Apply a night palette (from night.js). */
  setNight(n) {
    const u = this.bgU;
    u.uWall.value.setRGB(...n.wall, THREE.SRGBColorSpace);
    u.uSkyTop.value.setRGB(...n.skyTop, THREE.SRGBColorSpace);
    u.uSkyLow.value.setRGB(...n.skyLow, THREE.SRGBColorSpace);
    u.uStars.value = n.stars; u.uSunUp.value = n.sunUp ? 1 : 0; u.uLamp.value = n.lampI / 2.2;
    u.uOrb.value.set(n.orb[0], n.orb[1]);
    this.key.color.setRGB(...n.key, THREE.SRGBColorSpace);
    this.key.intensity = n.keyI;
    this.lamp.intensity = 14 * n.lampI;
    this.hemi.color.setRGB(...n.skyTop, THREE.SRGBColorSpace);
    this.hemi.groundColor.setRGB(...n.wall.map((v) => v * 0.5), THREE.SRGBColorSpace);
    this.hemi.intensity = 0.45 + n.keyI * 0.25;
    this.rim.color.setRGB(...n.skyTop.map((v) => Math.min(1, v * 1.6 + 0.1)), THREE.SRGBColorSpace);
  }

  project(v) {
    const p = v.clone().project(this.camera);
    return { x: (p.x + 1) / 2 * this.size.w, y: (1 - p.y) / 2 * this.size.h };
  }
}

export function canvasTex(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export { THREE };
