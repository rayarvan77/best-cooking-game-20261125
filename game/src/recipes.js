// recipes.js — one job: the food. Every ingredient (what it is, where it
// is prepared, what it becomes) and every recipe on the menu, with its
// price. Nothing here knows about the canvas or the clock.

export const INGREDIENTS = {
  bun:     { name: 'Bun',     icon: '🍞', key: '1', station: null,    ready: 'bun' },
  patty:   { name: 'Patty',   icon: '🥩', key: '2', station: 'grill', ready: 'grilled-patty' },
  lettuce: { name: 'Lettuce', icon: '🥬', key: '3', station: 'chop',  ready: 'chopped-lettuce' },
  tomato:  { name: 'Tomato',  icon: '🍅', key: '4', station: 'chop',  ready: 'sliced-tomato' },
  cheese:  { name: 'Cheese',  icon: '🧀', key: '5', station: null,    ready: 'cheese' },
  pasta:   { name: 'Pasta',   icon: '🍝', key: '6', station: 'pot',   ready: 'boiled-pasta' },
};

export const READY_ICON = {
  bun: '🍞',
  'grilled-patty': '🍔',
  'chopped-lettuce': '🥬',
  'sliced-tomato': '🍅',
  cheese: '🧀',
  'boiled-pasta': '🍝',
};

export const READY_NAME = {
  bun: 'Bun',
  'grilled-patty': 'Grilled patty',
  'chopped-lettuce': 'Chopped lettuce',
  'sliced-tomato': 'Sliced tomato',
  cheese: 'Cheese',
  'boiled-pasta': 'Boiled pasta',
};

export const STATIONS = {
  grill: { name: 'Grill', icon: '🔥', verb: 'Grilling', accepts: 'patty' },
  chop: { name: 'Chopping board', icon: '🔪', verb: 'Chopping', accepts: ['lettuce', 'tomato'] },
  pot: { name: 'Pasta pot', icon: '🍲', verb: 'Boiling', accepts: 'pasta' },
};

export const RECIPES = [
  {
    id: 'burger', name: 'Classic Burger', icon: '🍔', price: 12,
    needs: ['bun', 'grilled-patty', 'chopped-lettuce'],
  },
  {
    id: 'cheeseburger', name: 'Cheese Burger', icon: '🧀', price: 15,
    needs: ['bun', 'grilled-patty', 'cheese'],
  },
  {
    id: 'salad', name: 'Garden Salad', icon: '🥗', price: 9,
    needs: ['chopped-lettuce', 'sliced-tomato'],
  },
  {
    id: 'marinara', name: 'Pasta Marinara', icon: '🍝', price: 14,
    needs: ['boiled-pasta', 'sliced-tomato'],
  },
  {
    id: 'cheesy-pasta', name: 'Cheesy Pasta', icon: '🍜', price: 17,
    needs: ['boiled-pasta', 'cheese', 'sliced-tomato'],
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

// True when the plate holds exactly the recipe's ingredients, no more,
// no less, order-independent.
export function plateMatches(plate, recipe) {
  if (plate.length !== recipe.needs.length) return false;
  const have = [...plate].sort();
  const want = [...recipe.needs].sort();
  return have.every((item, i) => item === want[i]);
}

// The first order whose recipe the plate completes, or null.
export function matchingOrder(plate, orders) {
  for (const order of orders) {
    const recipe = recipeById(order.recipeId);
    if (recipe && plateMatches(plate, recipe)) return order;
  }
  return null;
}
