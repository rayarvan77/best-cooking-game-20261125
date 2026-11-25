// main.js — one job: run the game. Owns the canvas, the animation loop,
// the clock, and the wiring between state, input and render. No drawing
// and no rules of its own.

import { VIEW } from './config.js';
import { createState, tick } from './state.js';
import { draw } from './render.js';
import { attachInput } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

function fitCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = VIEW.w * dpr;
  canvas.height = VIEW.h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || '1') || 1;
const shot = params.get('shot');

let state = shot ? stageShot(shot, seed) : createState(seed);
window.__game = { get state() { return state; } };

attachInput(canvas, () => state, (next) => { state = next; });

// Chef walks toward where the player last clicked.
function moveChef(dt) {
  const chef = state.chef;
  const dx = chef.targetX - chef.x;
  const dy = chef.targetY - chef.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return;
  const speed = 420 * dt;
  const step = Math.min(dist, speed);
  chef.x += (dx / dist) * step;
  chef.y += (dy / dist) * step;
}

let last = performance.now();
let announced = '';

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  tick(state, dt);
  moveChef(dt);
  draw(ctx, state);

  const line = state.phase === 'playing'
    ? `Time ${Math.ceil(state.timeLeft)} seconds, $${state.coins}, ${state.served} served, ${state.orders.length} orders waiting.`
    : state.phase === 'over'
      ? `Shift over. $${state.coins} earned, ${state.served} dishes served.`
      : 'Sizzle and Serve. Press Enter or click to start your shift.';
  if (line !== announced) {
    announced = line;
    status.textContent = line;
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
