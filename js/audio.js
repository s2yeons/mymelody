// Tiny WebAudio music box: additive sines + a soft feedback echo.
let ctx = null;
let master = null;
let muted = false;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.32;

  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.23;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.28;
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 2600;
  master.connect(ctx.destination);
  master.connect(delay);
  delay.connect(tone).connect(feedback).connect(delay);
  tone.connect(ctx.destination);
  return ctx;
}

export const Sound = {
  get muted() { return muted; },
  set muted(v) { muted = v; },

  note(freq) {
    if (muted || !ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, now);
    out.gain.exponentialRampToValueAtTime(0.7, now + 0.006);
    out.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    out.connect(master);
    [[1, 'sine', 0.55], [2, 'sine', 0.2], [3.01, 'triangle', 0.07], [5.4, 'sine', 0.03]].forEach(([mul, type, amp]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq * mul;
      g.gain.setValueAtTime(amp, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.7 / mul);
      o.connect(g).connect(out);
      o.start(now);
      o.stop(now + 1.9);
    });
  },

  pop(pitch = 1) {
    if (muted || !ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(380 * pitch, now);
    o.frequency.exponentialRampToValueAtTime(1300 * pitch, now + 0.12);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.45, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    o.connect(g).connect(master);
    o.start(now);
    o.stop(now + 0.3);
  },
};
