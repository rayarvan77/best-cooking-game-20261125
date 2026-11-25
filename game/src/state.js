// state.js — one job: the game state and its rules. Creating a shift,
// spawning orders, cooking, plating and serving. No drawing, no input.

import {
  COOK_TIME, HEARTS, MAX_ORDERS, ORDER_PATIENCE, SHIFT_SECONDS,
  SPAWN_EVERY, SPAWN_RUSH, RUSH_AT, COMBO_STEP, TIP_MAX,
} from './config.js';
import { INGREDIENTS, RECIPES, matchingOrder, recipeById } from './recipes.js';

export function createState(seed = 1) {
  return {
    seed,
    phase: 'title', // title | playing | over
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    coins: 0,
    served: 0,
    lost: 0,
    hearts: HEARTS,
    combo: 0,
    bestCombo: 0,
    orders: [],
    spawnIn: 4,
    held: null,        // raw ingredient id the chef is carrying, or null
    readyTray: [],     // cooked ingredient ids waiting to be plated
    plate: [],         // ready ingredient ids on the plate
    stations: {
      grill: { busy: null, left: 0, total: 1 },
      chop: { busy: null, left: 0, total: 1 },
      pot: { busy: null, left: 0, total: 1 },
    },
    chef: { x: 640, y: 745, targetX: 640, targetY: 745, busy: false },
    popup: null,       // { text, sub, until } floating feedback
    flash: null,       // { text, until } big centre message
    muted: false,
    overReason: '',
  };
}

function nextRandom(state) {
  // Small deterministic PRNG so a seeded run replays the same orders.
  state.seed = (state.seed * 1103515245 + 12345) & 0x7fffffff;
  return state.seed / 0x7fffffff;
}

export function spawnOrder(state) {
  if (state.orders.length >= MAX_ORDERS) return;
  const pool = state.orders.length === 0
    ? RECIPES
    : RECIPES.filter((r) => !state.orders.some((o) => o.recipeId === r.id));
  const recipe = pool[Math.floor(nextRandom(state) * pool.length)];
  state.orders.push({
    id: state.seed + state.orders.length * 7 + state.elapsed,
    recipeId: recipe.id,
    patience: ORDER_PATIENCE,
    maxPatience: ORDER_PATIENCE,
    born: state.elapsed,
  });
}

export function startShift(state) {
  state.phase = 'playing';
  state.orders = [];
  state.spawnIn = 3;
  spawnOrder(state);
  spawnOrder(state);
  showFlash(state, 'SHIFT START!', 'Serve every order before patience runs out');
}

export function showPopup(state, text, sub = '') {
  state.popup = { text, sub, until: state.elapsed + 2.2 };
}

export function showFlash(state, text, sub = '') {
  state.flash = { text, sub, until: state.elapsed + 2.4 };
}

// The chef picks a raw ingredient off the counter.
export function pickIngredient(state, id) {
  if (state.phase !== 'playing') return false;
  if (state.held) { showPopup(state, 'Hands full!', 'Finish the ' + INGREDIENTS[state.held].name + ' first'); return false; }
  state.held = id;
  return true;
}

// Carry the held ingredient to its station and start cooking it.
export function useStation(state, stationId) {
  if (state.phase !== 'playing' || !state.held) return false;
  const station = state.stations[stationId];
  const ing = INGREDIENTS[state.held];
  if (ing.station !== stationId) {
    showPopup(state, ing.name + ' goes elsewhere', ing.station ? 'Try the ' + ing.station : 'It needs no cooking');
    return false;
  }
  if (station.busy) { showPopup(state, 'Station busy!', 'Wait for the timer'); return false; }
  station.busy = state.held;
  station.total = COOK_TIME[stationId];
  station.left = COOK_TIME[stationId];
  state.held = null;
  return true;
}

// Move a finished item from a station to the ready tray.
export function collectStation(state, stationId) {
  const station = state.stations[stationId];
  if (!station.busy || station.left > 0) return false;
  state.readyTray.push(INGREDIENTS[station.busy].ready);
  station.busy = null;
  return true;
}

// Put a ready ingredient from the tray onto the plate.
export function plateIngredient(state, readyId) {
  if (state.phase !== 'playing') return false;
  const i = state.readyTray.indexOf(readyId);
  if (i < 0) return false;
  if (state.plate.includes(readyId)) { showPopup(state, 'Already on the plate'); return false; }
  state.readyTray.splice(i, 1);
  state.plate.push(readyId);
  return true;
}

// An ingredient that needs no cooking goes straight from hand to plate.
export function plateHeld(state) {
  if (state.phase !== 'playing' || !state.held) return false;
  const ing = INGREDIENTS[state.held];
  if (ing.station) { showPopup(state, ing.name + ' must be cooked first'); return false; }
  if (state.plate.includes(ing.ready)) { showPopup(state, 'Already on the plate'); return false; }
  state.plate.push(ing.ready);
  state.held = null;
  return true;
}

export function clearPlate(state) {
  if (state.plate.length === 0 && !state.held) return false;
  state.plate = [];
  state.held = null;
  return true;
}

// Ring the serve bell: if the plate completes an order, serve it.
export function servePlate(state) {
  if (state.phase !== 'playing') return null;
  const order = matchingOrder(state.plate, state.orders);
  if (!order) {
    if (state.plate.length === 0) { showPopup(state, 'Plate is empty', 'Build a dish first'); return null; }
    showPopup(state, 'No order wants this dish', 'Check the order board');
    state.combo = 0;
    return null;
  }
  const recipe = recipeById(order.recipeId);
  const tip = Math.round((order.patience / order.maxPatience) * TIP_MAX);
  const comboBonus = state.combo * COMBO_STEP;
  const earned = recipe.price + tip + comboBonus;
  state.coins += earned;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.orders = state.orders.filter((o) => o !== order);
  state.plate = [];
  showPopup(state, 'SERVED! +$' + earned, recipe.name + (tip > 0 ? ' · fast serve tip $' + tip : '') + (comboBonus > 0 ? ' · combo +$' + comboBonus : ''));
  return { order, earned, recipe };
}

export function tick(state, dt) {
  if (state.phase !== 'playing') return;
  state.elapsed += dt;
  state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
  const rush = state.timeLeft <= RUSH_AT;

  // Cook timers.
  for (const key of Object.keys(state.stations)) {
    const st = state.stations[key];
    if (st.busy && st.left > 0) st.left = Math.max(0, st.left - dt);
  }

  // New orders.
  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    spawnOrder(state);
    state.spawnIn = rush ? SPAWN_RUSH : SPAWN_EVERY;
  }

  // Patience drains; a walked-out customer costs a heart and the combo.
  for (const order of [...state.orders]) {
    order.patience -= dt * (rush ? 1.35 : 1);
    if (order.patience <= 0) {
      state.orders = state.orders.filter((o) => o !== order);
      state.lost += 1;
      state.hearts -= 1;
      state.combo = 0;
      const recipe = recipeById(order.recipeId);
      showPopup(state, 'Customer walked out!', (recipe ? recipe.name : 'An order') + ' was too slow');
      if (state.hearts <= 0) return endShift(state, 'Out of hearts — too many customers walked out.');
    }
  }

  if (state.timeLeft <= 0) endShift(state, 'Shift complete!');
}

function endShift(state, reason) {
  state.phase = 'over';
  state.overReason = reason;
}

export function rushNow(state) {
  return state.phase === 'playing' && state.timeLeft <= RUSH_AT;
}
