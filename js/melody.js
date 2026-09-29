import * as THREE from 'three';

const anime = window.anime;
const TAU = Math.PI * 2;

export const P = {
  pink: '#f784ad',
  white: '#fffcfa',
  yellow: '#ffd43b',
  black: '#2b1a17',
  blush: '#ffa3b8',
  petal: '#fffcfa',
  line: '#4a2a22',
};

/* ---------- shared materials ---------- */

let gradTex;
export function gradientMap() {
  if (!gradTex) {
    gradTex = new THREE.DataTexture(new Uint8Array([110, 175, 225, 255]), 4, 1, THREE.RedFormat);
    gradTex.minFilter = gradTex.magFilter = THREE.NearestFilter;
    gradTex.generateMipmaps = false;
    gradTex.needsUpdate = true;
  }
  return gradTex;
}

export const toon = (color, opts = {}) =>
  new THREE.MeshToonMaterial({ color, gradientMap: gradientMap(), ...opts });

// Inverted-hull outline: the same geometry pushed out along its normals, back faces only.
const outlineMats = new Map();
function outline(mesh, thickness) {
  let mat = outlineMats.get(thickness);
  if (!mat) {
    mat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(P.line) }, uT: { value: thickness } },
      vertexShader: /* glsl */ `
        uniform float uT;
        void main() {
          vec3 p = position + normal * uT;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        void main() {
          gl_FragColor = vec4(uColor, 1.0);
          #include <colorspace_fragment>
        }`,
      side: THREE.BackSide,
    });
    outlineMats.set(thickness, mat);
  }
  const hull = new THREE.Mesh(mesh.geometry, mat);
  hull.raycast = () => {};
  mesh.add(hull);
  return hull;
}

/* ---------- face placement helpers ---------- */

// The hood is a squashed sphere; the white face is an ellipsoid sunk into its lower front.
const HOOD = { sx: 1.12, sy: 1.05, sz: 1 };
const FACE = { cx: 0, cy: -0.2, cz: 0.26, rx: 0.98, ry: 0.72, rz: 0.82 };
const Z = new THREE.Vector3(0, 0, 1);

function faceZ(x, y) {
  const u = (x - FACE.cx) / FACE.rx;
  const v = (y - FACE.cy) / FACE.ry;
  return FACE.cz + FACE.rz * Math.sqrt(Math.max(0, 1 - u * u - v * v));
}
function hoodZ(x, y) {
  const q = 1 - (x / HOOD.sx) ** 2 - (y / HOOD.sy) ** 2;
  return q > 0 ? HOOD.sz * Math.sqrt(q) : -1;
}

function onFace(x, y, lift = 0) {
  const u = (x - FACE.cx) / FACE.rx;
  const v = (y - FACE.cy) / FACE.ry;
  const w = Math.sqrt(Math.max(0, 1 - u * u - v * v));
  const n = new THREE.Vector3(u / FACE.rx, v / FACE.ry, w / FACE.rz).normalize();
  const p = new THREE.Vector3(x, y, FACE.cz + FACE.rz * w).addScaledVector(n, lift);
  return { p, n };
}

function stickToFace(obj, x, y, lift = 0) {
  const { p, n } = onFace(x, y, lift);
  obj.position.copy(p);
  obj.quaternion.setFromUnitVectors(Z, n);
  return obj;
}

function stickToHood(obj, x, y, lift = 0) {
  const z = hoodZ(x, y);
  const n = new THREE.Vector3(x / HOOD.sx ** 2, y / HOOD.sy ** 2, z / HOOD.sz ** 2).normalize();
  obj.position.set(x, y, z).addScaledVector(n, lift);
  obj.quaternion.setFromUnitVectors(Z, n);
  return obj;
}

// The brown line where the face meets the hood: bisect along rays from the face centre
// to find where the two surfaces cross, then sweep a tube through those points.
function faceRimCurve() {
  const pts = [];
  const N = 96;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU;
    const dx = Math.cos(a) * FACE.rx;
    const dy = Math.sin(a) * FACE.ry;
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 30; k++) {
      const m = (lo + hi) / 2;
      const x = FACE.cx + dx * m;
      const y = FACE.cy + dy * m;
      if (faceZ(x, y) > hoodZ(x, y)) lo = m; else hi = m;
    }
    const x = FACE.cx + dx * lo;
    const y = FACE.cy + dy * lo;
    pts.push(new THREE.Vector3(x, y, faceZ(x, y)));
  }
  return new THREE.CatmullRomCurve3(pts, true);
}

const SPHERE = new THREE.SphereGeometry(1, 56, 40);

/* ---------- character ---------- */

export function createMelody() {
  // root: scroll-driven transform · act: one-shot actions · bounce: idle breathing
  const root = new THREE.Group();
  const act = new THREE.Group();
  const bounce = new THREE.Group();
  root.add(act);
  act.add(bounce);
  bounce.position.y = -1.3;

  const head = new THREE.Group();
  head.position.y = 1.22;
  bounce.add(head);
  const bodyG = new THREE.Group();
  bounce.add(bodyG);

  const M = {
    pink: toon(P.pink),
    white: toon(P.white),
    yellow: toon(P.yellow),
    petal: toon(P.petal),
    black: new THREE.MeshBasicMaterial({ color: P.black }),
    line: new THREE.MeshBasicMaterial({ color: P.line }),
    shine: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
    blush: new THREE.MeshBasicMaterial({ color: P.blush, transparent: true, opacity: 0.6, depthWrite: false }),
  };

  // hood + face
  const hood = new THREE.Mesh(SPHERE, M.pink);
  hood.scale.set(HOOD.sx, HOOD.sy, HOOD.sz);
  head.add(hood);
  outline(hood, 0.03);

  const face = new THREE.Mesh(SPHERE, M.white);
  face.scale.set(FACE.rx, FACE.ry, FACE.rz);
  face.position.set(FACE.cx, FACE.cy, FACE.cz);
  head.add(face);

  const rimLine = new THREE.Mesh(new THREE.TubeGeometry(faceRimCurve(), 192, 0.024, 8, true), M.line);
  head.add(rimLine);

  // eyes: tall ovals set wide apart
  const eyes = [-1, 1].map((side) => {
    const g = new THREE.Group();
    const e = new THREE.Mesh(SPHERE, M.black);
    e.scale.set(0.078, 0.112, 0.036);
    const s = new THREE.Mesh(SPHERE, M.shine);
    s.scale.set(0.022, 0.03, 0.012);
    s.position.set(0.024, 0.045, 0.03);
    g.add(e, s);
    g.userData.close = 0;
    stickToFace(g, 0.37 * side, -0.14);
    head.add(g);
    return g;
  });

  const nose = new THREE.Mesh(SPHERE, M.yellow);
  nose.scale.set(0.068, 0.048, 0.04);
  stickToFace(nose, 0, -0.26, -0.008);
  head.add(nose);
  outline(nose, 0.35);

  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.014, 8, 24, Math.PI * 0.8), M.line);
  mouth.rotation.z = Math.PI * 1.1;
  const mouthHolder = new THREE.Group();
  mouthHolder.add(mouth);
  stickToFace(mouthHolder, 0, -0.33, 0.004);
  head.add(mouthHolder);

  [-1, 1].forEach((side) => {
    const b = new THREE.Mesh(SPHERE, M.blush);
    b.scale.set(0.1, 0.085, 0.012);
    stickToFace(b, 0.62 * side, -0.33, 0.006);
    head.add(b);
  });

  // ears — the viewer-left one stands tall, the viewer-right one flops over.
  // Each pivots at its base so it can swing on a spring.
  const earGeo = new THREE.CapsuleGeometry(0.36, 0.95, 12, 28);
  const upright = new THREE.Group();
  upright.position.set(-0.36, 0.55, -0.08);
  {
    const m = new THREE.Mesh(earGeo, M.pink);
    m.scale.set(1, 1, 0.72);
    m.position.y = 0.7;
    upright.add(m);
    outline(m, 0.04);
    upright.userData = { side: -1, baseZ: 0.14, baseX: -0.08, sz: 0, vz: 0, sx: 0, vx: 0, mesh: m };
  }
  head.add(upright);

  const floppy = new THREE.Group();
  floppy.position.set(0.36, 0.6, -0.05);
  const joint = new THREE.Group();
  const floppyMeshes = [];
  {
    const base = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.5, 12, 28), M.pink);
    base.scale.set(1, 1, 0.72);
    base.position.y = 0.45;
    floppy.add(base);
    outline(base, 0.04);
    joint.position.y = 0.8;
    floppy.add(joint);
    const tip = new THREE.Mesh(new THREE.CapsuleGeometry(0.33, 0.62, 12, 28), M.pink);
    tip.scale.set(1, 1, 0.7);
    tip.position.y = 0.42;
    joint.add(tip);
    outline(tip, 0.04);
    floppyMeshes.push(base, tip);
    floppy.userData = { side: 1, baseZ: -0.28, baseX: 0.05, sz: 0, vz: 0, sx: 0, vx: 0, mesh: base, joint, jointZ: -2.45 };
  }
  head.add(floppy);
  const ears = [upright, floppy];

  // white four-petal flower at the base of the upright ear
  const flower = new THREE.Group();
  const flowerSpin = new THREE.Group();
  flower.add(flowerSpin);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + Math.PI / 4;
    const petal = new THREE.Mesh(SPHERE, M.petal);
    petal.scale.set(0.13, 0.11, 0.05);
    petal.position.set(Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0);
    petal.rotation.z = a;
    flowerSpin.add(petal);
    outline(petal, 0.18);
  }
  const center = new THREE.Mesh(SPHERE, M.yellow);
  center.scale.set(0.065, 0.065, 0.05);
  center.position.z = 0.03;
  flowerSpin.add(center);
  outline(center, 0.25);
  stickToHood(flower, -0.72, 0.52, 0.05);
  head.add(flower);

  // body: small white bean with a pink cape over the shoulders
  const bodyGeo = new THREE.LatheGeometry(
    [[0.001, -0.5], [0.34, -0.49], [0.48, -0.38], [0.52, -0.12], [0.47, 0.18], [0.38, 0.45], [0.001, 0.56]]
      .map(([x, y]) => new THREE.Vector2(x, y)),
    56,
  );
  const body = new THREE.Mesh(bodyGeo, M.white);
  bodyG.add(body);
  outline(body, 0.03);

  // cape: an open cone with a gap at the front, like the hood's collar flaps
  const capeGeo = new THREE.CylinderGeometry(0.5, 0.74, 0.32, 56, 1, true, 0.42, TAU - 0.84);
  const cape = new THREE.Mesh(capeGeo, toon(P.pink, { side: THREE.DoubleSide }));
  cape.position.y = 0.3;
  bodyG.add(cape);
  outline(cape, 0.025);

  const hands = [-1, 1].map((side) => {
    const h = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.16, 8, 16), M.white);
    h.position.set(0.52 * side, -0.02, 0.06);
    h.rotation.z = 1.05 * side;
    bodyG.add(h);
    outline(h, 0.025);
    return h;
  });

  [-1, 1].forEach((side) => {
    const f = new THREE.Mesh(SPHERE, M.white);
    f.scale.set(0.21, 0.13, 0.26);
    f.position.set(0.21 * side, -0.5, 0.1);
    bodyG.add(f);
    outline(f, 0.12);
  });

  const hitMeshes = [hood, face, body, cape, upright.userData.mesh, ...floppyMeshes];

  /* ---------- behaviour ---------- */

  const tilt = { v: 0 };
  let prevYaw = 0;
  let prevPitch = 0;
  let nextBlink = 2.2;
  let busy = false;

  function kickEars(amount, axis = 'x') {
    ears.forEach((e) => {
      const d = e.userData;
      if (axis === 'x') d.vx += amount;
      else d.vz += amount * d.side;
    });
  }

  function blink() {
    anime({ targets: eyes.map((e) => e.userData), close: [0, 1], duration: 75, direction: 'alternate', easing: 'easeInQuad' });
  }

  function wink() {
    anime({ targets: eyes[1].userData, close: [0, 1], duration: 150, endDelay: 320, direction: 'alternate', easing: 'easeOutQuad' });
    anime({ targets: tilt, v: [0, 0.22], duration: 320, endDelay: 260, direction: 'alternate', easing: 'easeOutBack' });
    kickEars(-5);
  }

  function wiggle() {
    [0, 140, 280, 420, 560].forEach((d, i) => setTimeout(() => kickEars(i % 2 ? -11 : 11, 'z'), d));
    setTimeout(() => kickEars(-8), 600);
  }

  function jump(onLand) {
    if (busy) return;
    busy = true;
    anime.remove([act.scale, act.position]);
    anime.timeline({ complete: () => (busy = false) })
      .add({ targets: act.scale, x: 1.18, y: 0.78, z: 1.18, duration: 150, easing: 'easeOutQuad' })
      .add({ targets: act.scale, x: 0.9, y: 1.16, z: 0.9, duration: 180, easing: 'easeOutQuad', begin: () => kickEars(-9) })
      .add({ targets: act.position, y: 1.4, duration: 380, easing: 'easeOutCubic' }, '-=180')
      .add({ targets: act.rotation, y: '+=' + TAU, duration: 760, easing: 'easeInOutCubic' }, '-=380')
      .add({ targets: act.position, y: 0, duration: 380, easing: 'easeInCubic' }, '-=380')
      .add({
        targets: act.scale, x: 1.22, y: 0.78, z: 1.22, duration: 110, easing: 'easeOutQuad',
        begin: () => { kickEars(14); onLand && onLand(); },
      })
      .add({ targets: act.scale, x: 1, y: 1, z: 1, duration: 900, easing: 'easeOutElastic(1, .35)' });
  }

  function spin() {
    anime({ targets: act.rotation, y: '+=' + TAU, duration: 1200, easing: 'easeInOutBack' });
    setTimeout(() => wiggle(), 300);
  }

  let bopSide = 1;
  function bop(strength = 1) {
    kickEars(7 * strength);
    bopSide *= -1;
    anime.remove(tilt);
    anime({ targets: tilt, v: [0.14 * bopSide, 0], duration: 700, easing: 'easeOutElastic(1, .4)' });
    if (busy) return;
    anime.remove(act.scale);
    anime({ targets: act.scale, x: [1.08, 1], y: [0.9, 1], z: [1.08, 1], duration: 650, easing: 'easeOutElastic(1, .4)' });
  }

  function update(t, dt, look, wind = 0) {
    if (dt <= 0) return;
    const bob = Math.sin(t * 2.4);
    bounce.position.y = -1.3 + bob * 0.05;
    bounce.scale.set(1 - bob * 0.01, 1 + bob * 0.018, 1 - bob * 0.01);

    const k = 1 - Math.exp(-dt * 6);
    head.rotation.y += (look.x * 0.6 - head.rotation.y) * k;
    head.rotation.x += (-look.y * 0.35 - head.rotation.x) * k;
    head.rotation.z = Math.sin(t * 1.2) * 0.05 - head.rotation.y * 0.15 + tilt.v;

    const yawVel = (head.rotation.y - prevYaw) / dt;
    const pitchVel = (head.rotation.x - prevPitch) / dt;
    prevYaw = head.rotation.y;
    prevPitch = head.rotation.x;

    // floppy ears: damped springs driven by head motion, breathing and scroll wind
    ears.forEach((ear, i) => {
      const d = ear.userData;
      const idleZ = Math.sin(t * 1.7 + i * 1.9) * 0.05;
      const idleX = Math.sin(t * 1.3 + i) * 0.04;
      d.vz += (-90 * (d.sz - idleZ) - 7 * d.vz + yawVel * 2.4 * d.side) * dt;
      d.vx += (-90 * (d.sx - idleX) - 7 * d.vx - pitchVel * 2.5 + Math.cos(t * 2.4) * 0.35 + wind) * dt;
      d.sz += d.vz * dt;
      d.sx += d.vx * dt;
      ear.rotation.z = d.baseZ + d.sz;
      ear.rotation.x = d.baseX + d.sx;
      // the folded tip lags behind and swings more than the base
      if (d.joint) {
        d.joint.rotation.z = d.jointZ + d.sz * 1.6;
        d.joint.rotation.x = 0.35 + d.sx * 1.4;
      }
    });

    hands.forEach((h, i) => (h.position.y = -0.02 + Math.sin(t * 2.4 + i * Math.PI) * 0.025));
    flowerSpin.rotation.z = Math.sin(t * 0.9) * 0.25;

    if (t > nextBlink) {
      blink();
      if (Math.random() < 0.25) setTimeout(blink, 180);
      nextBlink = t + 1.8 + Math.random() * 3.5;
    }
    eyes.forEach((e) => (e.scale.y = 1 - e.userData.close * 0.92));
  }

  const tmp = new THREE.Vector3();
  const headWorld = () => head.getWorldPosition(tmp);

  return { root, act, head, hitMeshes, update, jump, spin, wink, wiggle, bop, kickEars, headWorld };
}
