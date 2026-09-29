const anime = window.anime;

const HEART_SVG = '<svg viewBox="0 0 32 29"><path d="M16 28.5S1 19.6 1 9.3C1 4.6 4.6 1 9.1 1c2.9 0 5.4 1.5 6.9 3.8C17.5 2.5 20 1 22.9 1 27.4 1 31 4.6 31 9.3 31 19.6 16 28.5 16 28.5z" fill="currentColor"/></svg>';
const fx = document.querySelector('.fx-layer');

/* ---------- split text into .word > .char ---------- */
export function splitText(el) {
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = 'word';
          for (const ch of part) {
            const c = document.createElement('span');
            c.className = 'char';
            c.textContent = ch;
            w.appendChild(c);
          }
          frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') {
        walk(n);
      }
    });
  };
  walk(el);
  return [...el.querySelectorAll('.char')];
}

export function revealChars(chars, delay = 0) {
  return anime({
    targets: chars,
    translateY: ['0.9em', 0],
    rotate: () => [anime.random(-25, 25), 0],
    scale: [0.4, 1],
    opacity: [0, 1],
    duration: 1100,
    delay: anime.stagger(32, { start: delay }),
    easing: 'easeOutElastic(1, .6)',
  });
}

export function revealStagger(parent) {
  return anime({
    targets: parent.children,
    translateY: [60, 0],
    rotate: () => [anime.random(-8, 8), 0],
    scale: [0.85, 1],
    opacity: [0, 1],
    duration: 1200,
    delay: anime.stagger(90),
    easing: 'easeOutElastic(1, .7)',
  });
}

export function countUp(el) {
  const target = Number(el.dataset.count);
  const o = { v: 0 };
  anime({
    targets: o, v: target, round: 1, duration: 1800, easing: 'easeOutExpo',
    update: () => (el.textContent = o.v),
  });
}

/* ---------- floating DOM fx ---------- */
let live = 0;
export function heartAt(x, y, { color = '#ff5c9a', size = 18, spread = 40, rise = 60, duration = 900 } = {}) {
  if (live > 60) return;
  live++;
  const el = document.createElement('span');
  el.className = 'fx-heart';
  el.style.color = color;
  el.style.width = size + 'px';
  el.style.height = size * 0.9 + 'px';
  el.innerHTML = HEART_SVG;
  fx.appendChild(el);
  anime({
    targets: el,
    translateX: [x - size / 2, x - size / 2 + anime.random(-spread, spread)],
    translateY: [y - size / 2, y - size / 2 - rise - anime.random(0, rise)],
    rotate: [anime.random(-30, 30), anime.random(-90, 90)],
    scale: [{ value: [0, 1.1], duration: duration * 0.25, easing: 'easeOutBack' }, { value: 0, duration: duration * 0.75, easing: 'easeInQuad' }],
    opacity: [1, 0.2],
    duration,
    easing: 'easeOutQuad',
    complete: () => { el.remove(); live--; },
  });
}

export function noteAt(x, y, text, color) {
  const el = document.createElement('span');
  el.className = 'fx-note';
  el.textContent = text;
  el.style.color = color;
  fx.appendChild(el);
  anime({
    targets: el,
    translateX: [x - 10, x - 10 + anime.random(-60, 60)],
    translateY: [y, y - 180 - anime.random(0, 80)],
    rotate: [0, anime.random(-40, 40)],
    scale: [{ value: [0.2, 1.4], duration: 300, easing: 'easeOutBack' }, { value: 0.6, duration: 900 }],
    opacity: [{ value: 1, duration: 600 }, { value: 0, duration: 600 }],
    duration: 1200,
    easing: 'easeOutCubic',
    complete: () => el.remove(),
  });
}

/* ---------- custom cursor with heart trail ---------- */
export function initCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return { setMelody() {} };
  document.body.classList.add('has-cursor');
  const cursor = document.querySelector('.cursor');
  const dot = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringPos = { ...pos };
  let last = { ...pos };
  let lastT = 0;
  const colors = ['#ff5c9a', '#ff8fb8', '#ffd43b', '#ffffff'];

  addEventListener('pointermove', (e) => {
    pos.x = e.clientX;
    pos.y = e.clientY;
    const now = performance.now();
    const d = Math.hypot(pos.x - last.x, pos.y - last.y);
    if (d > 34 && now - lastT > 35) {
      heartAt(pos.x, pos.y, { color: colors[(Math.random() * colors.length) | 0], size: 10 + Math.random() * 12, spread: 20, rise: 30, duration: 800 });
      last = { ...pos };
      lastT = now;
    }
  });
  document.addEventListener('pointerover', (e) => {
    cursor.classList.toggle('is-hover', !!e.target.closest('a, button, [data-tilt], .key'));
  });

  (function loop() {
    ringPos.x += (pos.x - ringPos.x) * 0.18;
    ringPos.y += (pos.y - ringPos.y) * 0.18;
    dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
    requestAnimationFrame(loop);
  })();

  return { setMelody: (on) => cursor.classList.toggle('is-melody', on) };
}

/* ---------- magnetic buttons ---------- */
export function initMagnetic() {
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * 0.35;
      const y = (e.clientY - (r.top + r.height / 2)) * 0.45;
      anime.remove(el);
      anime.set(el, { translateX: x, translateY: y });
    });
    el.addEventListener('pointerleave', () => {
      anime({ targets: el, translateX: 0, translateY: 0, duration: 900, easing: 'easeOutElastic(1, .3)' });
    });
  });
}

/* ---------- 3D tilt cards with glare ---------- */
export function initTilt() {
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    el.addEventListener('pointerenter', () => {
      el.style.transition = 'transform .12s ease-out';
      el.style.setProperty('--glare', 1);
    });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--rx', `${-py * 16}deg`);
      el.style.setProperty('--ry', `${px * 20}deg`);
      el.style.setProperty('--gx', `${(px + 0.5) * 100}%`);
      el.style.setProperty('--gy', `${(py + 0.5) * 100}%`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform .9s cubic-bezier(.2, 1.8, .4, 1)';
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--glare', 0);
    });
  });
}
