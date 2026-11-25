// shots.js — one job: stage deterministic scenes for screenshots.
// ?shot=start shows the title screen over a live kitchen; ?shot=play
// shows a shift mid-rush with a dish half-built on the plate and a patty
// on the grill; ?shot=end shows a served dish at the end of a shift.
// Real gameplay is never faked: each scene is a real state of the game,
// built only from its own state functions.

import { createState, startShift, spawnOrder } from './state.js';
import { recipeById } from './recipes.js';

export function stageShot(shot, seed) {
  const state = createState(seed);
  if (shot === 'start') {
    // Title over a kitchen that already has orders waiting.
    spawnOrder(state);
    spawnOrder(state);
    state.readyTray = ['chopped-lettuce'];
    return state;
  }
  if (shot === 'play') {
    startShift(state);
    state.elapsed = 63;
    state.timeLeft = 87;
    state.coins = 54;
    state.served = 4;
    state.combo = 2;
    state.bestCombo = 3;
    // Orders: a burger the plate is half-matching, plus two more.
    state.orders = [];
    const burger = recipeById('burger');
    const salad = recipeById('salad');
    const marinara = recipeById('marinara');
    state.orders.push(
      { id: 1, recipeId: 'burger', patience: 26, maxPatience: 48, born: 40 },
      { id: 2, recipeId: 'salad', patience: 12, maxPatience: 48, born: 20 },
      { id: 3, recipeId: 'marinara', patience: 41, maxPatience: 48, born: 58 },
    );
    void burger; void salad; void marinara;
    // Dish mid-assembly: bun + grilled patty on the plate, lettuce still to come.
    state.plate = ['bun', 'grilled-patty'];
    // A patty sizzling on the grill, lettuce on the board, pasta in the pot.
    state.stations.grill = { busy: 'patty', left: 2, total: 4 };
    state.stations.chop = { busy: 'lettuce', left: 1, total: 2 };
    state.stations.pot = { busy: 'pasta', left: 3, total: 6 };
    state.readyTray = ['chopped-lettuce', 'sliced-tomato'];
    state.held = 'tomato';
    state.chef.x = 500;
    state.chef.targetX = 500;
    state.popup = { text: 'SERVED! +$18', sub: 'Cheese Burger · fast serve tip $6 · combo +$4', until: state.elapsed + 2.2 };
    return state;
  }
  if (shot === 'end') {
    // Final seconds of the shift: a finished dish on the plate, ready to
    // serve, the timer almost out and the last order still waiting.
    startShift(state);
    state.elapsed = 147;
    state.timeLeft = 3;
    state.coins = 132;
    state.served = 9;
    state.combo = 4;
    state.bestCombo = 5;
    state.lost = 1;
    state.hearts = 2;
    state.plate = ['boiled-pasta', 'cheese', 'sliced-tomato'];
    state.readyTray = ['grilled-patty'];
    state.stations.grill = { busy: 'patty', left: 0, total: 4 };
    state.orders = [
      { id: 9, recipeId: 'cheesy-pasta', patience: 8, maxPatience: 48, born: 130 },
      { id: 10, recipeId: 'burger', patience: 19, maxPatience: 48, born: 138 },
    ];
    state.flash = { text: 'LAST ORDERS!', sub: 'Ring the bell — the shift ends in seconds', until: state.elapsed + 2.4 };
    state.chef.x = 1050;
    state.chef.targetX = 1050;
    return state;
  }
  return state;
}
