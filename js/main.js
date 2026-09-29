import * as THREE from 'three';
import { createMelody } from './melody.js';
import { createBackground, createHeartField, createBurst, heartGeometry, flowerGeometry } from './world.js';
import { Sound } from './audio.js';
import { THEMES, STAGES, SAYINGS, FRIENDS, HISTORY, NOTES, SONG } from './content.js';
import * as UI from './ui.js';

const { anime, gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);
document.documentElement.classList.add('js');
history.scrollRestoration = 'manual';
scrollTo(0, 0);

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* =========================================================
   Content
   ========================================================= */

$('.sayings__track').insertAdjacentHTML('beforeend', SAYINGS.map((s, i) => `
  <article class="saying${s.dark ? ' saying--dark' : ''}" style="--c:${s.c}; --r:${i % 2 ? 2.5 : -2.5}deg">
    <span class="saying__mark">“</span>
    <span class="saying__num">MAMA SAID · 0${i + 1}</span>
    <p class="saying__quote" data-quote>${s.text}</p>
    <span class="saying__foot">— ${s.foot}</span>
  </article>`).join(''));

$('.friends__grid').innerHTML = FRIENDS.map((f) => `
  <div class="friend"><div class="friend__card" data-tilt>
    <div class="friend__avatar" style="--c:${f.c}"><svg viewBox="0 0 100 100">${f.svg}</svg></div>
    <h3 class="friend__name">${f.name}<small>${f.en}</small></h3>
    <span class="friend__role">${f.role}</span>
    <p class="friend__desc">${f.desc}</p>
  </div></div>`).join('');

$('.timeline__list').innerHTML = HISTORY.map((h) => `
  <li class="tl">
    <div class="tl__year">${h.year}</div>
    <h3 class="tl__title">${h.title}</h3>
    <p class="tl__text">${h.text}</p>
  </li>`).join('');

$('#keys').innerHTML = NOTES.map((n, i) => `
  <button class="key" type="button" data-note="${i}" style="--c:${n.c}" aria-label="${n.label}">
    <b>${n.label}</b><small>${n.key.toUpperCase()}</small>
  </button>`).join('');

const heroChars = UI.splitText($('.hero__title'));
const splitMap = new Map($$('[data-split]:not([data-split="hero"])').map((el) => [el, UI.splitText(el)]));
const quoteMap = new Map($$('[data-quote]').map((el) => [el, UI.splitText(el)]));

/* =========================================================
   Three.js scene
   ========================================================= */

const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.autoClear = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0.2, 9);

scene.add(new THREE.HemisphereLight('#fff4f8', '#ffb3cf', 1.7));
const key = new THREE.DirectionalLight('#ffffff', 2.4);
key.position.set(-3, 5, 6);
scene.add(key);
const rimLight = new THREE.DirectionalLight('#ffd1e3', 1.6);
rimLight.position.set(3, 2, -5);
scene.add(rimLight);

const bg = createBackground();
const melody = createMelody();
scene.add(melody.root);
melody.act.scale.setScalar(0.001);

const hearts = createHeartField(scene, innerWidth < 700 ? 60 : 120);
const burstHearts = createBurst(scene, heartGeometry(), 220);
const burstFlowers = createBurst(scene, flowerGeometry(), 220);
const PINKS = ['#ff8fb8', '#ffc2da', '#ffffff', '#ff5c9a', '#ffd43b'];

function burst(pos, n = 16, colors = PINKS, power = 1) {
  const half = Math.ceil(n / 2);
  burstFlowers.spawn(pos, half, colors, power);
  burstHearts.spawn(pos, n - half, colors, power);
}

function resize() {
  const w = innerWidth;
  const h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  bg.uniforms.uRes.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
}
resize();
addEventListener('resize', resize);

/* ---------- pointer / picking ---------- */

const pointer = new THREE.Vector2(0, 0); // NDC
const pointerSmooth = new THREE.Vector2(0, 0);
const pointerWorld = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const zPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
let hasPointer = false;

addEventListener('pointermove', (e) => {
  pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  hasPointer = true;
});

function pick(clientX, clientY) {
  raycaster.setFromCamera({ x: (clientX / innerWidth) * 2 - 1, y: -(clientY / innerHeight) * 2 + 1 }, camera);
  const hit = raycaster.intersectObjects(melody.hitMeshes, false)[0];
  const world = new THREE.Vector3();
  raycaster.ray.intersectPlane(zPlane, world);
  return { hit, world };
}

const cursor = UI.initCursor();
UI.initMagnetic();
UI.initTilt();

let introDone = false;
addEventListener('pointerdown', (e) => {
  if (!introDone || e.target.closest('a, button, [data-tilt], .nav, .key')) return;
  const { hit, world } = pick(e.clientX, e.clientY);
  if (hit) {
    Sound.pop(1);
    melody.jump(() => burst(melody.headWorld().clone(), 30, PINKS, 1.3));
    for (let i = 0; i < 8; i++) UI.heartAt(e.clientX, e.clientY, { size: 22, spread: 90, rise: 90 });
  } else {
    const inPlay = e.target.closest('#play');
    Sound.pop(1.4 + Math.random() * 0.4);
    burst(world, inPlay ? 22 : 10, PINKS, inPlay ? 1.1 : 0.7);
    melody.kickEars(4);
  }
});

/* =========================================================
   Scroll: Lenis + ScrollTrigger
   ========================================================= */

const lenis = new Lenis({ lerp: reduceMotion ? 1 : 0.085, wheelMultiplier: 1 });
lenis.stop();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

$$('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    e.preventDefault();
    lenis.scrollTo(a.getAttribute('href'), { duration: 1.8 });
  }),
);
$('#toTop').addEventListener('click', () => lenis.scrollTo(0, { duration: 2.4 }));

// Scroll-scrubbed state that drives the 3D scene
const S = { ...STAGES[0], pinSpin: 0 };
const sections = $$('main > section, main > footer');
let hTween = null;

sections.forEach((sec, i) => {
  if (i > 0) {
    gsap.fromTo(S, { ...STAGES[i - 1] }, {
      ...STAGES[i],
      ease: 'power1.inOut',
      immediateRender: false,
      scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top top', scrub: 1.2 },
    });
  }
  if (sec.id === 'sayings') {
    const track = $('.sayings__track');
    const dist = () => track.scrollWidth - innerWidth;
    hTween = gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: sec, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
        onUpdate: (self) => (S.pinSpin = self.progress * Math.PI * 2),
      },
    });
  }
});

// section counter + dark footer
const counterNum = $('.counter__num');
const counterLabel = $('.counter__label');
sections.forEach((sec, i) => {
  ScrollTrigger.create({
    trigger: sec.closest('.pin-spacer') || sec, start: 'top 55%', end: 'bottom 55%',
    onToggle: (self) => {
      if (!self.isActive) return;
      counterNum.textContent = String(i + 1).padStart(2, '0');
      counterLabel.textContent = sec.dataset.label;
      anime.remove([counterNum, counterLabel]);
      anime({ targets: [counterNum, counterLabel], translateY: [14, 0], opacity: [0, 1], duration: 700, delay: anime.stagger(80), easing: 'easeOutExpo' });
    },
  });
});
ScrollTrigger.create({ trigger: '#outro', start: 'top 60%', toggleClass: { targets: document.body, className: 'is-dark' } });

const bar = $('.progress__bar');
ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => (bar.style.transform = `scaleX(${self.progress})`) });

// reveals
splitMap.forEach((chars, el) => {
  ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => UI.revealChars(chars) });
});
$$('[data-reveal]').forEach((el) => {
  ScrollTrigger.create({
    trigger: el, start: 'top 85%', once: true,
    onEnter: () => anime({ targets: el, translateY: [40, 0], opacity: [0, 1], duration: 1200, delay: 200, easing: 'easeOutExpo' }),
  });
});
$$('[data-stagger]').forEach((el) => {
  ScrollTrigger.create({
    trigger: el, start: 'top 82%', once: true,
    onEnter: () => {
      UI.revealStagger(el);
      $$('[data-count]', el).forEach((c) => setTimeout(() => UI.countUp(c), 300));
    },
  });
});

// sayings cards pop their words as they slide in
quoteMap.forEach((chars, el) => {
  ScrollTrigger.create({
    trigger: el.closest('.saying'), containerAnimation: hTween, start: 'left 88%', once: true,
    onEnter: () => {
      UI.revealChars(chars);
      anime({ targets: el.closest('.saying').querySelector('.saying__mark'), scale: [0, 1], rotate: [-40, 0], duration: 1400, easing: 'easeOutElastic(1, .5)' });
    },
  });
});

// timeline: self-drawing path + heart runner
const tlPath = $('.timeline__path');
const tlSvg = $('.timeline__svg');
const runner = $('.timeline__runner');
const tlLen = tlPath.getTotalLength();
function moveRunner(p) {
  const pt = tlPath.getPointAtLength(p * tlLen);
  const r = tlSvg.getBoundingClientRect();
  runner.style.transform = `translate3d(${(pt.x / 100) * r.width}px, ${(pt.y / 1000) * r.height}px, 0) rotate(${Math.sin(p * 40) * 12}deg)`;
}
moveRunner(0);
gsap.fromTo(tlPath, { strokeDashoffset: 1 }, {
  strokeDashoffset: 0, ease: 'none',
  scrollTrigger: { trigger: '.timeline__body', start: 'top 65%', end: 'bottom 65%', scrub: 0.6, onUpdate: (self) => moveRunner(self.progress) },
});
$$('.tl').forEach((li) => {
  ScrollTrigger.create({
    trigger: li, start: 'top 65%',
    onEnter: () => {
      li.classList.add('is-on');
      anime({ targets: li.querySelector('.tl__year'), scale: [1.25, 1], rotate: [-6, 0], duration: 1100, easing: 'easeOutElastic(1, .45)' });
      anime({ targets: li.querySelectorAll('.tl__title, .tl__text'), translateX: [-30, 0], opacity: [0, 1], delay: anime.stagger(120, { start: 120 }), duration: 900, easing: 'easeOutExpo' });
      melody.kickEars(6);
    },
    onLeaveBack: () => li.classList.remove('is-on'),
  });
});

/* =========================================================
   Hero title: per-letter jelly hover
   ========================================================= */

heroChars.forEach((c) => {
  c.addEventListener('pointerenter', () => {
    if (!introDone) return;
    anime.remove(c);
    anime({
      targets: c,
      keyframes: [
        { translateY: -46, scaleX: 0.85, scaleY: 1.18, rotate: anime.random(-14, 14), duration: 220, easing: 'easeOutQuad' },
        { translateY: 0, scaleX: 1, scaleY: 1, rotate: 0, duration: 1000, easing: 'easeOutElastic(1, .35)' },
      ],
    });
    Sound.note(NOTES[heroChars.indexOf(c) % NOTES.length].f * 0.5);
  });
});

/* =========================================================
   Play: keyboard, actions, song
   ========================================================= */

const keyEls = $$('.key');
const screenPos = new THREE.Vector3();
function worldToScreen(v) {
  screenPos.copy(v).project(camera);
  return { x: (screenPos.x * 0.5 + 0.5) * innerWidth, y: (-screenPos.y * 0.5 + 0.5) * innerHeight };
}

function playNote(i) {
  const n = NOTES[i];
  Sound.note(n.f);
  melody.bop(0.7 + i * 0.08);
  const el = keyEls[i];
  el.classList.add('is-down');
  setTimeout(() => el.classList.remove('is-down'), 140);
  anime.remove(el);
  anime({ targets: el, scaleY: [0.92, 1], rotate: [i % 2 ? 2 : -2, 0], duration: 700, easing: 'easeOutElastic(1, .4)' });
  const r = el.getBoundingClientRect();
  UI.noteAt(r.left + r.width / 2, r.top, ['♪', '♫', '♬', '♩'][i % 4], n.c);
  const head = melody.headWorld().clone();
  head.y += 0.8;
  burstHearts.spawn(head, 5, [n.c, '#ffffff'], 0.8);
}

keyEls.forEach((el, i) => el.addEventListener('pointerdown', () => playNote(i)));
addEventListener('keydown', (e) => {
  if (e.repeat || e.metaKey || e.ctrlKey) return;
  const i = NOTES.findIndex((n) => n.key === e.key.toLowerCase());
  if (i >= 0) playNote(i);
});

let songTimer = null;
const songBtn = $('[data-action="song"]');
function stopSong() {
  clearTimeout(songTimer);
  songTimer = null;
  songBtn.classList.remove('is-playing');
  songBtn.textContent = '▶ 반짝반짝 작은별';
}
function playSong() {
  if (songTimer) return stopSong();
  songBtn.classList.add('is-playing');
  songBtn.textContent = '■ 멈추기';
  let step = 0;
  const tick = () => {
    if (step >= SONG.length) { stopSong(); melody.jump(() => burst(melody.headWorld().clone(), 40, PINKS, 1.4)); return; }
    const n = SONG[step++];
    if (n >= 0) playNote(n);
    songTimer = setTimeout(tick, 340);
  };
  tick();
}

const actions = {
  jump: () => melody.jump(() => burst(melody.headWorld().clone(), 26, PINKS, 1.2)),
  wink: () => {
    melody.wink();
    const p = worldToScreen(melody.headWorld());
    for (let i = 0; i < 6; i++) setTimeout(() => UI.heartAt(p.x + 60, p.y, { size: 26, spread: 70, rise: 80 }), i * 60);
  },
  ears: () => melody.wiggle(),
  spin: () => { melody.spin(); burst(melody.headWorld().clone(), 18, ['#ffd43b', '#ffffff', '#ff8fb8'], 1); },
  song: playSong,
};
$$('[data-action]').forEach((b) => b.addEventListener('click', () => { Sound.pop(1.2); actions[b.dataset.action](); }));

const soundBtn = $('#soundBtn');
soundBtn.addEventListener('click', () => {
  Sound.muted = !Sound.muted;
  soundBtn.setAttribute('aria-pressed', String(!Sound.muted));
  $('.nav__sound-label', soundBtn).textContent = Sound.muted ? 'SOUND OFF' : 'SOUND ON';
});

/* =========================================================
   Render loop
   ========================================================= */

const themes = THEMES.map((t) => t.map((c) => new THREE.Color(c)));
const clock = new THREE.Clock();
const marquee = $('.marquee__inner');
const sayTrack = $('.sayings__track');
let marqueeX = 0;
let hoverCheck = 0;
const melodyNDC = new THREE.Vector3();

function layoutFactor() {
  const a = innerWidth / innerHeight;
  if (a < 0.8) return { x: 0.14, s: 0.6, y: 0.5 };
  if (a < 1.25) return { x: 0.55, s: 0.8, y: 0.2 };
  return { x: 1, s: 1, y: 0 };
}

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 1 / 30);
  const t = clock.elapsedTime;
  const vel = lenis.velocity || 0;
  const lf = layoutFactor();

  pointerSmooth.lerp(pointer, 1 - Math.exp(-dt * 8));

  // melody transform from scroll state
  const R = melody.root;
  R.position.set(S.x * lf.x, S.y + lf.y + Math.sin(t * 0.8) * 0.06, 0);
  R.scale.setScalar(S.s * lf.s);
  R.scale.y *= 1 + THREE.MathUtils.clamp(Math.abs(vel) * 0.0015, 0, 0.08);
  R.rotation.set(S.rx, S.ry + S.pinSpin, THREE.MathUtils.clamp(-vel * 0.0025, -0.25, 0.25));

  // look toward the cursor, relative to where Melody is on screen
  melodyNDC.copy(R.position).project(camera);
  const look = { x: THREE.MathUtils.clamp(pointerSmooth.x - melodyNDC.x, -1.2, 1.2), y: THREE.MathUtils.clamp(pointerSmooth.y - melodyNDC.y - 0.2, -1, 1) };
  melody.update(t, dt, look, THREE.MathUtils.clamp(vel * 0.06, -3, 3));

  // hearts + bursts
  raycaster.setFromCamera(pointerSmooth, camera);
  raycaster.ray.intersectPlane(zPlane, pointerWorld);
  hearts.update(t, dt, THREE.MathUtils.clamp(vel * 0.06, -3, 5), hasPointer ? pointerWorld : null);
  burstHearts.update(dt);
  burstFlowers.update(dt);

  // melody hover → cursor label (every few frames)
  if (++hoverCheck % 4 === 0 && hasPointer && introDone) {
    raycaster.setFromCamera(pointer, camera);
    cursor.setMelody(raycaster.intersectObjects(melody.hitMeshes, false).length > 0);
  }

  // background theme blend
  const i0 = Math.floor(S.theme);
  const i1 = Math.min(i0 + 1, themes.length - 1);
  const f = S.theme - i0;
  const u = bg.uniforms;
  u.uA.value.copy(themes[i0][0]).lerp(themes[i1][0], f);
  u.uB.value.copy(themes[i0][1]).lerp(themes[i1][1], f);
  u.uC.value.copy(themes[i0][2]).lerp(themes[i1][2], f);
  u.uDark.value = THREE.MathUtils.clamp(S.theme - 6, 0, 1);
  u.uTime.value = t;
  u.uScroll.value = (lenis.scroll || 0) / innerHeight * 0.15;
  u.uMouse.value.set(pointerSmooth.x * 0.5 + 0.5, pointerSmooth.y * 0.5 + 0.5);

  // parallax camera
  camera.position.x += (pointerSmooth.x * 0.35 - camera.position.x) * 0.05;
  camera.position.y += (0.2 + pointerSmooth.y * 0.2 - camera.position.y) * 0.05;
  camera.lookAt(0, 0, 0);

  // marquee reacts to scroll speed and direction
  marqueeX -= (1.2 + Math.abs(vel) * 0.25) * (vel < 0 ? -1 : 1);
  const half = marquee.scrollWidth / 2;
  if (half) {
    if (marqueeX < -half) marqueeX += half;
    if (marqueeX > 0) marqueeX -= half;
    marquee.style.transform = `translate3d(${marqueeX}px,0,0) skewX(${THREE.MathUtils.clamp(-vel * 0.3, -12, 12)}deg)`;
  }
  sayTrack.style.setProperty('--skew', `${THREE.MathUtils.clamp(-vel * 0.12, -8, 8)}deg`);

  renderer.clear();
  renderer.render(bg.scene, bg.camera);
  renderer.clearDepth();
  renderer.render(scene, camera);
});

/* =========================================================
   Loader → intro
   ========================================================= */

async function boot() {
  const num = $('#loaderNum');
  const beat = anime({ targets: '.loader__heart', scale: [1, 1.2], duration: 360, direction: 'alternate', loop: true, easing: 'easeInOutSine' });
  const prog = { v: 0 };
  await Promise.all([
    document.fonts.ready,
    new Promise((resolve) => anime({
      targets: prog, v: 100, round: 1, duration: reduceMotion ? 200 : 1900, easing: 'easeInOutQuart',
      update: () => (num.textContent = prog.v), complete: resolve,
    })),
  ]);
  ScrollTrigger.refresh();

  anime.timeline({ easing: 'easeInOutExpo' })
    .add({ targets: '.loader__inner', scale: [1, 0.6], opacity: [1, 0], duration: 450, easing: 'easeInBack' })
    .add({
      targets: '#loader', translateY: ['0%', '-100%'], borderBottomLeftRadius: ['0%', '50%'], borderBottomRightRadius: ['0%', '50%'], duration: 1000,
      complete: () => { beat.pause(); $('#loader').remove(); },
    }, '-=150');

  setTimeout(intro, 700);
}

function intro() {
  anime.timeline({ easing: 'easeOutExpo', complete: () => { introDone = true; lenis.start(); } })
    .add({
      targets: melody.act.scale, x: [0.001, 1], y: [0.001, 1], z: [0.001, 1], duration: 1700, easing: 'easeOutElastic(1, .42)',
      begin: () => { melody.kickEars(16); Sound.pop(0.8); },
    })
    .add({ targets: melody.act.rotation, y: [-Math.PI * 2, 0], duration: 1500, easing: 'easeOutQuart' }, 0)
    .add({
      targets: heroChars, translateY: ['110%', '0%'], rotateX: [-100, 0], opacity: [0, 1],
      duration: 1500, delay: anime.stagger(70), easing: 'easeOutElastic(1, .55)',
    }, 250)
    .add({
      targets: ['.hero__eyebrow', '.hero__sub', '.hero__hint'], translateY: [30, 0], opacity: [0, 1],
      delay: anime.stagger(120), duration: 1000,
    }, 700)
    .add({ targets: ['.nav', '.counter'], translateY: [-24, 0], opacity: [0, 1], duration: 900 }, 900);

  setTimeout(() => burst(melody.headWorld().clone(), 36, PINKS, 1.4), 350);
}

boot();
