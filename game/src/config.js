// config.js — one job: every tunable number, colour and layout box for
// Sizzle & Serve, so balancing the game never means hunting through logic.

export const VIEW = { w: 1280, h: 800 };

export const SHIFT_SECONDS = 150;      // one full shift
export const RUSH_AT = 30;              // last 30 s: rush hour
export const MAX_ORDERS = 3;
export const ORDER_PATIENCE = 48;       // seconds before a customer walks out
export const SPAWN_EVERY = 13;          // seconds between new orders
export const SPAWN_RUSH = 8;            // ...during rush hour
export const HEARTS = 3;

export const COOK_TIME = { grill: 4, chop: 2, pot: 6 }; // seconds per station
export const TIP_MAX = 10;              // bonus coins for a fast serve
export const COMBO_STEP = 2;            // +coins per combo level

// Layout boxes (logical 1280x800 canvas, scaled to the window).
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 64 },
  board: { x: 24, y: 80, w: 560, h: 150 },
  grill: { x: 40, y: 300, w: 250, h: 150 },
  board2: { x: 330, y: 300, w: 250, h: 150 }, // chopping board
  pot: { x: 620, y: 300, w: 250, h: 150 },    // pasta pot
  plate: { x: 910, y: 300, w: 330, h: 150 },  // plating counter
  serve: { x: 910, y: 466, w: 330, h: 64 },   // serve bell
  bins: { x: 24, y: 560, w: 1216, h: 120 },   // ingredient counter
  floor: { y: 700 },
};

export const COLORS = {
  wall: '#7a4a2b',
  wallDark: '#5f3820',
  floor: '#3d2b1f',
  floorTile: '#4a3527',
  counter: '#c98f4e',
  counterEdge: '#8a5a28',
  steel: '#b9c4cc',
  board: '#fff6e0',
  boardInk: '#3a2415',
  ticket: '#fffdf5',
  ticketEdge: '#d8c49a',
  patGreen: '#58b368',
  patAmber: '#f2a541',
  patRed: '#e4572e',
  cream: '#fff3d6',
  ink: '#2b1a10',
  gold: '#ffcf3f',
};

export const KEYS = {
  '1': 'bun', '2': 'patty', '3': 'lettuce',
  '4': 'tomato', '5': 'cheese', '6': 'pasta',
};
