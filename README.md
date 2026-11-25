# Sizzle & Serve — Rush Hour Kitchen

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/rayarvan77/best-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/rayarvan77/best-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

An entry for the [make.fun](https://make.fun) bounty
**"Make the best cooking game"** — a complete, original cooking game
that runs in a desktop browser from static files, with no network
requests.

## The game

You are the only chef on a 150-second lunch shift. Orders land on the
board with a patience bar; every dish is built on the plate from
ingredients you prepare yourself:

- **Pick** an ingredient off the counter (click it, or press `1`–`6`):
  bun, patty, lettuce, tomato, cheese, pasta.
- **Cook it** at the right station — patty on the grill (4 s), lettuce
  and tomato on the chopping board (2 s), pasta in the pot (6 s) —
  then collect it into the ready tray when its timer rings.
- **Plate it** (click the tray, or `Space`), matching the recipe on the
  order ticket. The board dims each ingredient as it lands, so you can
  see at a glance what a dish still needs.
- **Serve it** — click the bell or press `Enter`. Fast serves earn tips,
  back-to-back serves build a combo bonus, and a wrong dish costs the
  combo.

Five recipes (Classic Burger, Cheese Burger, Garden Salad, Pasta
Marinara, Cheesy Pasta) combine the same six ingredients in different
ways, so every shift plays differently. A customer whose patience runs
out walks out and costs a heart; three walk-outs end the shift early.
The last 30 seconds are **Rush Hour**: orders arrive faster and
patience drains quicker.

Sounds are synthesized live with the Web Audio API (sizzle, chop, bell,
coins) — no audio files — and `M` mutes.

## How to play

```sh
node serve.ts        # serves game/ at http://localhost:8080
```

Open http://localhost:8080 in a desktop browser, click **Start Shift**
(or press `Enter`), and cook. Keyboard: `1`–`6` pick ingredients,
`G` grill, `C` chop, `B` boil, `Space` plate, `Enter` serve,
`Backspace` clear the plate, and `Enter` restarts after a shift ends.
Mouse does everything too: click a bin, a station, the tray, the
plate, or the serve bell.

## Files

- `game/index.html` — the page; `game/src/` holds the game, one job
  per file: `config.js` (tuning + layout), `recipes.js` (ingredients
  and the menu), `state.js` (rules: orders, cooking, serving, scoring),
  `input.js` (mouse + keyboard), `render.js` (all canvas drawing),
  `audio.js` (synthesized sounds), `shots.js` (staged screenshot
  scenes), `main.js` (loop + wiring).
- `main.ts` (Node 22) — copies `game/` and `screenshots/` to `/output`
  and writes `/output/dossier.json` with the vendored make.fun library.
- `screenshots/` — three real renders of the game: the title screen over
  a live kitchen, a shift mid-rush with a burger half-built on the
  plate, and the final seconds with a finished dish ready to serve.

## License

MIT — see [LICENSE](LICENSE).
