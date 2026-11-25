// audio.js — one job: every sound, made with the Web Audio API only.
// No audio files, no network. The game stays silent until the player
// first interacts (browsers block audio before a gesture).

let ctx = null;
let muted = false;

export function setMuted(value) { muted = value; }
export function isMuted() { return muted; }

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', gain = 0.12, when = 0) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  pickup() { tone(520, 0.08, 'triangle', 0.10); },
  chop() { tone(180, 0.07, 'square', 0.10); tone(90, 0.06, 'square', 0.08, 0.05); },
  sizzle() { tone(1400, 0.25, 'sawtooth', 0.03); tone(900, 0.2, 'sawtooth', 0.03, 0.08); },
  ding() { tone(880, 0.15, 'sine', 0.12); tone(1318, 0.25, 'sine', 0.10, 0.12); },
  coin() { tone(988, 0.09, 'triangle', 0.12); tone(1319, 0.18, 'triangle', 0.12, 0.08); },
  error() { tone(160, 0.15, 'sawtooth', 0.08); },
  walkout() { tone(330, 0.2, 'sawtooth', 0.09); tone(220, 0.3, 'sawtooth', 0.09, 0.18); },
  rush() { tone(660, 0.12, 'square', 0.08); tone(880, 0.12, 'square', 0.08, 0.12); },
};
