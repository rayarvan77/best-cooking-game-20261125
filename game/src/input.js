// input.js — one job: turn mouse clicks and key presses into game
// actions. It knows where every clickable zone is; it never draws.

import { LAYOUT, KEYS } from './config.js';
import { INGREDIENTS } from './recipes.js';
import {
  pickIngredient, useStation, collectStation, plateIngredient,
  plateHeld, clearPlate, servePlate, startShift, createState,
} from './state.js';
import { sfx, setMuted, isMuted } from './audio.js';

export function binRect(i) {
  return { x: 24 + i * 202, y: 560, w: 190, h: 120 };
}

export function trayRect(i) {
  return { x: 24 + i * 76, y: 470, w: 64, h: 64 };
}

function inside(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function toLogical(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (1280 / rect.width),
    y: (clientY - rect.top) * (800 / rect.height),
  };
}

export function attachInput(canvas, getState, setState) {
  function act(fn, okSound) {
    const state = getState();
    const before = state.held;
    const result = fn(state);
    if (result === false || result === null) {
      if (state.popup) sfx.error();
      return;
    }
    if (okSound) okSound();
    if (state.held !== before && state.held) sfx.pickup();
  }

  function clickAt(px, py) {
    const state = getState();
    state.chef.targetX = Math.max(60, Math.min(1220, px));
    state.chef.targetY = 745;

    if (state.phase === 'title') { startShift(state); sfx.ding(); return; }
    if (state.phase === 'over') {
      setState(createState((Math.random() * 1e9) | 0));
      startShift(getState());
      sfx.ding();
      return;
    }

    // Ingredient bins along the counter.
    for (let i = 0; i < 6; i++) {
      if (inside(px, py, binRect(i))) {
        const id = Object.keys(INGREDIENTS)[i];
        act((s) => pickIngredient(s, id));
        return;
      }
    }
    // Ready tray slots.
    for (let i = 0; i < state.readyTray.length; i++) {
      if (inside(px, py, trayRect(i))) {
        const readyId = state.readyTray[i];
        act((s) => plateIngredient(s, readyId), () => sfx.ding());
        return;
      }
    }
    // Cooking stations: collect a finished dish, else start cooking.
    for (const key of ['grill', 'chop', 'pot']) {
      const box = key === 'grill' ? LAYOUT.grill : key === 'chop' ? LAYOUT.board2 : LAYOUT.pot;
      if (inside(px, py, box)) {
        const st = state.stations[key];
        if (st.busy && st.left <= 0) act((s) => collectStation(s, key), () => sfx.ding());
        else if (state.held) act((s) => useStation(s, key), () => sfx.sizzle());
        return;
      }
    }
    // Plate: drop a no-cook ingredient straight on.
    if (inside(px, py, LAYOUT.plate)) {
      act((s) => plateHeld(s), () => sfx.ding());
      return;
    }
    // Serve bell.
    if (inside(px, py, LAYOUT.serve)) {
      const served = servePlate(state);
      if (served) sfx.coin();
      else if (state.popup) sfx.error();
      return;
    }
    // Trash can (clears the plate).
    if (inside(px, py, { x: 1216, y: 466, w: 40, h: 64 })) {
      act((s) => clearPlate(s));
    }
  }

  canvas.addEventListener('pointerdown', (e) => {
    const p = toLogical(canvas, e.clientX, e.clientY);
    clickAt(p.x, p.y);
  });

  window.addEventListener('keydown', (e) => {
    const state = getState();
    if (e.key === 'm' || e.key === 'M') { setMuted(!isMuted()); return; }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (state.phase === 'title') { startShift(state); sfx.ding(); return; }
      if (state.phase === 'over') {
        setState(createState((Math.random() * 1e9) | 0));
        startShift(getState());
        sfx.ding();
        return;
      }
      if (e.key === 'Enter') {
        const served = servePlate(state);
        if (served) sfx.coin();
        else if (state.popup) sfx.error();
      } else if (state.held) {
        act((s) => plateHeld(s), () => sfx.ding());
      } else if (state.readyTray.length > 0) {
        act((s) => plateIngredient(s, state.readyTray[0]), () => sfx.ding());
      }
      return;
    }
    if (state.phase !== 'playing') return;
    const ing = KEYS[e.key];
    if (ing) { act((s) => pickIngredient(s, ing)); return; }
    const stationKey = { g: 'grill', G: 'grill', c: 'chop', C: 'chop', b: 'pot', B: 'pot' }[e.key];
    if (stationKey) {
      const st = state.stations[stationKey];
      if (st.busy && st.left <= 0) act((s) => collectStation(s, stationKey), () => sfx.ding());
      else if (state.held) act((s) => useStation(s, stationKey), () => sfx.sizzle());
      return;
    }
    if (e.key === 'Backspace' || e.key === 'Delete') act((s) => clearPlate(s));
  });
}
