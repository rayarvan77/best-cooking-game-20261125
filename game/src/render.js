// render.js — one job: draw everything. One canvas, one frame, no game
// logic beyond reading the state. Every zone it draws lines up with the
// hit zones in input.js.

import { COLORS, LAYOUT, VIEW } from './config.js';
import { INGREDIENTS, READY_ICON, READY_NAME, STATIONS, recipeById } from './recipes.js';
import { binRect, trayRect } from './input.js';

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function patienceColor(p) {
  if (p > 0.5) return COLORS.patGreen;
  if (p > 0.25) return COLORS.patAmber;
  return COLORS.patRed;
}

export function draw(ctx, state) {
  const { w, h } = VIEW;
  ctx.clearRect(0, 0, w, h);

  // --- walls and floor ---
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, w, 700);
  ctx.fillStyle = COLORS.wallDark;
  ctx.fillRect(0, 252, w, 10);
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 700, w, 100);
  ctx.fillStyle = COLORS.floorTile;
  for (let x = 0; x < w; x += 80) ctx.fillRect(x, 700, 2, 100);
  for (let y = 700; y < h; y += 50) ctx.fillRect(0, y, w, 2);

  drawTopBar(ctx, state);
  drawOrderBoard(ctx, state);
  drawStation(ctx, state, 'grill', LAYOUT.grill);
  drawStation(ctx, state, 'chop', LAYOUT.board2);
  drawStation(ctx, state, 'pot', LAYOUT.pot);
  drawPlateCounter(ctx, state);
  drawServeBell(ctx, state);
  drawReadyTray(ctx, state);
  drawBins(ctx, state);
  drawChef(ctx, state);
  drawPopup(ctx, state);

  if (state.phase === 'title') drawTitle(ctx, state);
  if (state.phase === 'over') drawGameOver(ctx, state);
}

function drawTopBar(ctx, state) {
  const b = LAYOUT.topBar;
  ctx.fillStyle = '#241610';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('🍳 SIZZLE & SERVE', 24, 34);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = COLORS.cream;
  ctx.fillText('Rush Hour Kitchen', 380, 36);

  // Shift timer — big, and red when it runs low.
  const low = state.timeLeft <= 30 && state.phase === 'playing';
  ctx.fillStyle = low ? COLORS.patRed : COLORS.cream;
  ctx.font = 'bold 34px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('⏱ ' + fmtTime(state.timeLeft), 640, 34);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = COLORS.cream;
  ctx.fillText(state.phase === 'playing' ? (low ? 'RUSH HOUR' : 'SHIFT TIMER') : 'SHIFT TIMER', 640, 56);

  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('💰 $' + state.coins, 1060, 30);
  ctx.font = '15px sans-serif';
  ctx.fillStyle = COLORS.cream;
  ctx.fillText('Served ' + state.served + '  ·  Combo x' + state.combo, 1060, 54);
  ctx.font = '22px sans-serif';
  ctx.fillText('❤️'.repeat(Math.max(0, state.hearts)) + '🤍'.repeat(Math.max(0, 3 - state.hearts)), 1260, 34);
}

function drawOrderBoard(ctx, state) {
  const b = LAYOUT.board;
  ctx.fillStyle = COLORS.board;
  roundRect(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = COLORS.boardInk;
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('📋 ORDER BOARD', b.x + 14, b.y + 22);

  if (state.orders.length === 0) {
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#8a6d4b';
    ctx.fillText('No orders yet — the lunch crowd is coming…', b.x + 14, b.y + 80);
    return;
  }
  state.orders.forEach((order, i) => {
    const x = b.x + 14 + i * 178;
    const y = b.y + 44;
    const recipe = recipeById(order.recipeId);
    ctx.fillStyle = COLORS.ticket;
    roundRect(ctx, x, y, 166, 92, 10);
    ctx.fill();
    ctx.strokeStyle = COLORS.ticketEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(recipe.icon, x + 8, y + 26);
    ctx.fillStyle = COLORS.boardInk;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(recipe.name, x + 46, y + 16);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#6b4a2a';
    ctx.fillText('$' + recipe.price + '  ·  #' + (i + 1), x + 46, y + 34);
    // What the dish still needs, as icons.
    ctx.font = '18px sans-serif';
    let ix = x + 10;
    for (const need of recipe.needs) {
      const done = state.plate.includes(need);
      ctx.globalAlpha = done ? 0.35 : 1;
      ctx.fillText(READY_ICON[need], ix, y + 62);
      ix += 26;
    }
    ctx.globalAlpha = 1;
    // Patience bar.
    const p = Math.max(0, order.patience / order.maxPatience);
    ctx.fillStyle = '#e8dcc0';
    roundRect(ctx, x + 8, y + 78, 150, 8, 4);
    ctx.fill();
    ctx.fillStyle = patienceColor(p);
    roundRect(ctx, x + 8, y + 78, 150 * p, 8, 4);
    ctx.fill();
  });
}

function drawStation(ctx, state, key, box) {
  const st = state.stations[key];
  const info = STATIONS[key];
  ctx.fillStyle = COLORS.counter;
  roundRect(ctx, box.x, box.y, box.w, box.h, 12);
  ctx.fill();
  ctx.strokeStyle = COLORS.counterEdge;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = COLORS.boardInk;
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(info.icon + ' ' + info.name.toUpperCase(), box.x + box.w / 2, box.y + 22);

  const cx = box.x + box.w / 2;
  const cy = box.y + 82;
  if (!st.busy) {
    ctx.font = '44px sans-serif';
    ctx.globalAlpha = 0.45;
    ctx.fillText(key === 'grill' ? '♨️' : key === 'chop' ? '🥒' : '🍲', cx, cy);
    ctx.globalAlpha = 1;
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#6b4a2a';
    const firstAccept = Array.isArray(info.accepts) ? info.accepts[0] : info.accepts;
    ctx.fillText('empty — bring ' + INGREDIENTS[firstAccept].name.toLowerCase(), cx, box.y + 128);
    return;
  }
  const ing = INGREDIENTS[st.busy];
  ctx.font = '46px sans-serif';
  ctx.fillText(ing.icon, cx, cy);
  if (st.left > 0) {
    // Cook timer: ring + seconds.
    const p = 1 - st.left / st.total;
    ctx.strokeStyle = '#e8dcc0';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 36, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = COLORS.patAmber;
    ctx.beginPath();
    ctx.arc(cx, cy, 36, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
    ctx.stroke();
    ctx.fillStyle = COLORS.boardInk;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(Math.ceil(st.left) + 's', cx, cy + 52);
  } else {
    ctx.fillStyle = COLORS.patGreen;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('✓ READY — click to collect', cx, box.y + 128);
  }
}

function drawPlateCounter(ctx, state) {
  const box = LAYOUT.plate;
  ctx.fillStyle = COLORS.steel;
  roundRect(ctx, box.x, box.y, box.w, box.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#7d8b96';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = COLORS.boardInk;
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🍽 PLATING COUNTER', box.x + box.w / 2, box.y + 22);

  const cx = box.x + box.w / 2;
  const cy = box.y + 88;
  ctx.fillStyle = '#f4f7f9';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 92, 42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#9fb0bc';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#e3eaee';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 62, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  if (state.plate.length === 0) {
    ctx.fillStyle = '#8a9aa5';
    ctx.font = '15px sans-serif';
    ctx.fillText('plate is empty', cx, cy);
  } else {
    ctx.font = '34px sans-serif';
    const total = state.plate.length;
    state.plate.forEach((item, i) => {
      const px = cx + (i - (total - 1) / 2) * 52;
      ctx.fillText(READY_ICON[item], px, cy - 4);
    });
    ctx.fillStyle = COLORS.boardInk;
    ctx.font = '13px sans-serif';
    ctx.fillText(state.plate.map((p) => READY_NAME[p]).join(' + '), cx, box.y + 134);
  }
  // Trash can.
  ctx.font = '26px sans-serif';
  ctx.fillText('🗑', 1236, box.y + 120);
}

function drawServeBell(ctx, state) {
  const box = LAYOUT.serve;
  const ready = state.plate.length > 0;
  ctx.fillStyle = ready ? COLORS.gold : '#8a7a5a';
  roundRect(ctx, box.x, box.y, box.w, box.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#6b4a2a';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = COLORS.ink;
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🔔  SERVE  (Enter)', box.x + box.w / 2, box.y + 34);
}

function drawReadyTray(ctx, state) {
  ctx.fillStyle = COLORS.boardInk;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('READY TRAY — click to plate', 24, 462);
  for (let i = 0; i < 6; i++) {
    const r = trayRect(i);
    ctx.fillStyle = i < state.readyTray.length ? '#fff6e0' : '#5f4630';
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#8a6d4b';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (i < state.readyTray.length) {
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(READY_ICON[state.readyTray[i]], r.x + 32, r.y + 34);
    }
  }
}

function drawBins(ctx, state) {
  ctx.fillStyle = COLORS.cream;
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🥬 INGREDIENT COUNTER — click or press 1–6', 24, 552);
  const ids = Object.keys(INGREDIENTS);
  ids.forEach((id, i) => {
    const r = binRect(i);
    const ing = INGREDIENTS[id];
    const held = state.held === id;
    ctx.fillStyle = held ? '#ffe9a8' : COLORS.counter;
    roundRect(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fill();
    ctx.strokeStyle = held ? COLORS.gold : COLORS.counterEdge;
    ctx.lineWidth = held ? 4 : 3;
    ctx.stroke();
    ctx.font = '44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ing.icon, r.x + r.w / 2, r.y + 52);
    ctx.fillStyle = COLORS.boardInk;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(ing.name, r.x + r.w / 2, r.y + 92);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#6b4a2a';
    const hint = ing.station ? '→ ' + STATIONS[ing.station].name : '→ plate';
    ctx.fillText('[' + ing.key + ']  ' + hint, r.x + r.w / 2, r.y + 110);
  });
}

function drawChef(ctx, state) {
  const { x, y } = state.chef;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + 34, 30, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body (apron) and head.
  ctx.fillStyle = '#f5f0e6';
  roundRect(ctx, x - 22, y - 6, 44, 40, 10);
  ctx.fill();
  ctx.fillStyle = '#e4572e';
  roundRect(ctx, x - 22, y + 8, 44, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath();
  ctx.arc(x, y - 22, 17, 0, Math.PI * 2);
  ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 10, y - 36, 10, 0, Math.PI * 2);
  ctx.arc(x, y - 42, 12, 0, Math.PI * 2);
  ctx.arc(x + 10, y - 36, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 18, y - 38, 36, 8);
  // Eyes and smile.
  ctx.fillStyle = '#2b1a10';
  ctx.beginPath();
  ctx.arc(x - 6, y - 24, 2, 0, Math.PI * 2);
  ctx.arc(x + 6, y - 24, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b1a10';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 20, 6, 0.2, Math.PI - 0.2);
  ctx.stroke();
  // Held ingredient floats above the hand.
  if (state.held) {
    ctx.font = '34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(INGREDIENTS[state.held].icon, x + 34, y - 30);
  }
}

function drawPopup(ctx, state) {
  if (state.popup && state.elapsed < state.popup.until) {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(20,10,5,0.85)';
    roundRect(ctx, 390, 238, 500, 50, 12);
    ctx.fill();
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(state.popup.text, 640, 258);
    if (state.popup.sub) {
      ctx.fillStyle = COLORS.cream;
      ctx.font = '14px sans-serif';
      ctx.fillText(state.popup.sub, 640, 280);
    }
  }
  if (state.flash && state.elapsed < state.flash.until) {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(20,10,5,0.8)';
    roundRect(ctx, 340, 232, 600, 62, 14);
    ctx.fill();
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(state.flash.text, 640, 258);
    if (state.flash.sub) {
      ctx.fillStyle = COLORS.cream;
      ctx.font = '15px sans-serif';
      ctx.fillText(state.flash.sub, 640, 282);
    }
  }
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(20,10,5,0.72)';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText('🍳 SIZZLE & SERVE', 640, 210);
  ctx.fillStyle = COLORS.cream;
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('Rush Hour Kitchen', 640, 258);
  ctx.font = '20px sans-serif';
  ctx.fillText('The lunch crowd is hungry. Grill, chop and boil —', 640, 320);
  ctx.fillText('build each dish on the plate and ring the bell to serve.', 640, 348);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#ffd98a';
  ctx.fillText('🖱 Click ingredients, stations and the plate   ·   ⌨️  1–6 pick · G grill · C chop · B boil · Space plate · Enter serve', 640, 420);
  ctx.fillText('Orders lose patience — serve fast for tips and combos. 3 walk-outs ends the shift.', 640, 452);
  ctx.fillStyle = COLORS.gold;
  roundRect(ctx, 480, 500, 320, 64, 14);
  ctx.fill();
  ctx.fillStyle = COLORS.ink;
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('▶  START SHIFT', 640, 540);
  ctx.fillStyle = COLORS.cream;
  ctx.font = '15px sans-serif';
  ctx.fillText('150-second shift  ·  5 recipes  ·  M mutes sound', 640, 600);
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(20,10,5,0.78)';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 54px sans-serif';
  ctx.fillText('🏁 SHIFT OVER', 640, 220);
  ctx.fillStyle = COLORS.cream;
  ctx.font = '22px sans-serif';
  ctx.fillText(state.overReason, 640, 268);
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('💰 $' + state.coins + ' earned   ·   🍽 ' + state.served + ' dishes served', 640, 340);
  ctx.font = '22px sans-serif';
  ctx.fillText('Best combo x' + state.bestCombo + '   ·   ' + state.lost + ' customers walked out', 640, 384);
  const verdict = state.coins >= 120 ? '⭐⭐⭐ Master Chef! The kitchen is yours.'
    : state.coins >= 70 ? '⭐⭐ Solid service — the crowd keeps coming back.'
    : '⭐ A quiet shift — the grill is still warm for another try.';
  ctx.fillStyle = '#ffd98a';
  ctx.font = '20px sans-serif';
  ctx.fillText(verdict, 640, 430);
  ctx.fillStyle = COLORS.gold;
  roundRect(ctx, 470, 480, 340, 64, 14);
  ctx.fill();
  ctx.fillStyle = COLORS.ink;
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('↻  PLAY AGAIN', 640, 520);
}
