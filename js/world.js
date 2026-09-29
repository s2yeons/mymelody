import * as THREE from 'three';
import { gradientMap } from './melody.js';

const rand = THREE.MathUtils.randFloat;

/* ---------- full-screen shader background ---------- */

const BG_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime, uScroll, uDark;
  uniform vec2 uRes, uMouse;
  uniform vec3 uA, uB, uC;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
    return v;
  }

  void main() {
    float asp = uRes.x / uRes.y;
    vec2 p = (vUv - 0.5) * vec2(asp, 1.0);
    float t = uTime * 0.05;

    // domain-warped candy clouds
    vec2 w = vec2(fbm(p * 1.3 + t), fbm(p * 1.3 - t + 4.0));
    float n = fbm(p * 1.1 + w * 1.4 + vec2(0.0, -uScroll * 0.6));
    vec3 col = mix(uA, uB, smoothstep(0.3, 0.75, n));
    col = mix(col, uC, smoothstep(0.62, 0.9, fbm(p * 2.2 - w + t * 2.0)) * 0.55);

    // cursor glow
    vec2 m = (uMouse - 0.5) * vec2(asp, 1.0);
    col += uC * smoothstep(0.55, 0.0, length(p - m)) * 0.22;

    // drifting polka dots
    vec2 q = mat2(0.866, -0.5, 0.5, 0.866) * p * 8.0;
    q += vec2(uTime * 0.12, uScroll * 7.0);
    vec2 id = floor(q);
    vec2 cell = fract(q) - 0.5;
    float r = 0.09 + 0.07 * sin(uTime * 1.3 + hash(id) * 6.2831);
    float dotMask = smoothstep(r, r - 0.025, length(cell));
    col = mix(col, mix(vec3(1.0), uC, uDark), dotMask * mix(0.28, 0.12, uDark));

    // vignette + grain
    col *= 1.0 - 0.22 * dot(p * vec2(0.7, 1.0), p * vec2(0.7, 1.0));
    col += (hash(vUv * uRes + fract(uTime)) - 0.5) * 0.03;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export function createBackground() {
  const uniforms = {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uDark: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uA: { value: new THREE.Color() },
    uB: { value: new THREE.Color() },
    uC: { value: new THREE.Color() },
  };
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: BG_FRAG,
      depthTest: false,
      depthWrite: false,
    }),
  );
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);
  return { scene, camera: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), uniforms };
}

/* ---------- geometries ---------- */

export function heartGeometry() {
  const s = new THREE.Shape();
  s.moveTo(5, 5);
  s.bezierCurveTo(5, 5, 4, 0, 0, 0);
  s.bezierCurveTo(-6, 0, -6, 7, -6, 7);
  s.bezierCurveTo(-6, 11, -3, 15.4, 5, 19);
  s.bezierCurveTo(12, 15.4, 16, 11, 16, 7);
  s.bezierCurveTo(16, 7, 16, 0, 10, 0);
  s.bezierCurveTo(7, 0, 5, 5, 5, 5);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 3, bevelEnabled: true, bevelThickness: 2.2, bevelSize: 1.6, bevelSegments: 5, curveSegments: 18,
  });
  g.center();
  g.rotateZ(Math.PI);
  g.scale(0.035, 0.035, 0.035);
  return g;
}

export function flowerGeometry() {
  const s = new THREE.Shape();
  const N = 120;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = 0.5 * (0.45 + 0.55 * Math.pow(Math.abs(Math.cos(2.5 * a)), 0.7));
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    i === 0 ? s.moveTo(x, y) : s.lineTo(x, y);
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.09, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 });
  g.center();
  return g;
}

/* ---------- ambient heart field ---------- */

export function createHeartField(scene, count = 120) {
  const mesh = new THREE.InstancedMesh(
    heartGeometry(),
    new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: gradientMap() }),
    count,
  );
  mesh.frustumCulled = false;
  const palette = ['#ff8fb8', '#ffc2da', '#ffffff', '#ffd43b', '#ff6fa3', '#ffe0ec', '#ffffff'].map((c) => new THREE.Color(c));
  const items = [];
  for (let i = 0; i < count; i++) {
    const z = rand(-10, 1.2);
    items.push({
      p: new THREE.Vector3(rand(-10, 10), rand(-7.5, 7.5), z),
      off: new THREE.Vector2(),
      r: new THREE.Euler(rand(0, 6.3), rand(0, 6.3), rand(-0.4, 0.4)),
      rv: new THREE.Vector3(rand(-0.8, 0.8), rand(-1.2, 1.2), rand(-0.3, 0.3)),
      s: rand(0.3, 0.75) * (z > -1 ? 0.55 : 1),
      sp: rand(0.12, 0.45),
      ph: rand(0, 6.3),
    });
    mesh.setColorAt(i, palette[i % palette.length]);
  }
  scene.add(mesh);
  const dummy = new THREE.Object3D();

  function update(t, dt, boost, pw) {
    for (let i = 0; i < count; i++) {
      const it = items[i];
      it.p.y += (it.sp + boost) * dt;
      it.p.x += Math.sin(t * 0.6 + it.ph) * 0.25 * dt;
      if (it.p.y > 7.8) { it.p.y = -7.8; it.p.x = rand(-10, 10); }
      if (it.p.y < -7.8) { it.p.y = 7.8; it.p.x = rand(-10, 10); }

      // hearts near the pointer plane get shoved aside
      if (pw) {
        const dx = it.p.x + it.off.x - pw.x;
        const dy = it.p.y + it.off.y - pw.y;
        const d2 = dx * dx + dy * dy;
        const zf = 1 - Math.min(1, Math.abs(it.p.z) / 5);
        if (d2 < 5 && zf > 0) {
          const f = (1 - d2 / 5) * zf * 7 * dt;
          it.off.x += dx * f;
          it.off.y += dy * f;
        }
      }
      it.off.multiplyScalar(1 - Math.min(1, dt * 1.2));

      it.r.x += it.rv.x * dt * (1 + boost);
      it.r.y += it.rv.y * dt * (1 + boost);
      dummy.position.set(it.p.x + it.off.x, it.p.y + it.off.y, it.p.z);
      dummy.rotation.copy(it.r);
      dummy.scale.setScalar(it.s * (1 + Math.sin(t * 3 + it.ph) * 0.07));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  return { mesh, update };
}

/* ---------- particle bursts (pooled) ---------- */

export function createBurst(scene, geometry, max = 260) {
  const mesh = new THREE.InstancedMesh(
    geometry,
    new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: gradientMap(), side: THREE.DoubleSide }),
    max,
  );
  mesh.frustumCulled = false;
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const items = [];
  for (let i = 0; i < max; i++) {
    mesh.setMatrixAt(i, zero);
    mesh.setColorAt(i, new THREE.Color('#fff'));
    items.push({ alive: false, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), rv: new THREE.Vector3(), life: 0, max: 1, s: 1 });
  }
  scene.add(mesh);
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  let cursor = 0;
  let alive = 0;

  function spawn(pos, n, colors, power = 1) {
    for (let k = 0; k < n; k++) {
      const i = cursor;
      cursor = (cursor + 1) % max;
      const it = items[i];
      if (!it.alive) alive++;
      it.alive = true;
      it.p.copy(pos);
      const a = rand(0, Math.PI * 2);
      const sp = rand(1.8, 5.2) * power;
      it.v.set(Math.cos(a) * sp, Math.sin(a) * sp + 2.6 * power, rand(-1, 1.5));
      it.r.set(rand(0, 6.3), rand(0, 6.3), rand(0, 6.3));
      it.rv.set(rand(-8, 8), rand(-8, 8), rand(-4, 4));
      it.life = it.max = rand(1.4, 2.6);
      it.s = rand(0.22, 0.42);
      mesh.setColorAt(i, col.set(colors[k % colors.length]));
    }
    mesh.instanceColor.needsUpdate = true;
  }

  function update(dt) {
    if (!alive) return;
    for (let i = 0; i < max; i++) {
      const it = items[i];
      if (!it.alive) continue;
      it.life -= dt;
      if (it.life <= 0) {
        it.alive = false;
        alive--;
        mesh.setMatrixAt(i, zero);
        continue;
      }
      it.v.y -= 5.5 * dt;
      it.v.multiplyScalar(1 - Math.min(1, dt * 1.4));
      it.p.addScaledVector(it.v, dt);
      it.r.x += it.rv.x * dt;
      it.r.y += it.rv.y * dt;
      it.r.z += it.rv.z * dt;
      const age = it.max - it.life;
      const grow = Math.min(1, age / 0.18);
      const fade = Math.min(1, it.life / 0.6);
      dummy.position.copy(it.p);
      dummy.rotation.copy(it.r);
      dummy.scale.setScalar(it.s * grow * (2 - grow) * fade);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  return { spawn, update };
}
