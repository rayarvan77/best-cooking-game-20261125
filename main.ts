// main.ts — Sizzle & Serve, an entry for the make.fun bounty
// "Make the best cooking game" (best-cooking-game-20261125-0137).
//
// The game itself is plain static files under game/ (index.html plus ES
// modules, no library, no network request) that open in a desktop browser.
// This program hands the game in: it copies game/ and screenshots/ from
// beside this file into /output and writes /output/dossier.json, the
// summary the judge reads, using the vendored make.fun library.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for
// /output, e.g.:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Node 22, standard library only.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps: only text_max_bytes shapes the dossier bytes; the
// rest refuse an entry the scorer would refuse (more than 4 screenshots
// or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files in all, or a path under game/ over 1000 bytes). game/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Say what was handed in, so a local run shows the result at a glance.
import { readdirSync, statSync } from 'node:fs';
const dossierBytes = statSync(join(out, 'dossier.json')).size;
const gameFiles = readdirSync(join(out, 'game'), { recursive: true }).length;
const shots = readdirSync(join(out, 'screenshots'));
console.log('Sizzle & Serve handed in to ' + out);
console.log(`  game files: ${gameFiles}, screenshots: ${shots.join(', ')}`);
console.log(`  dossier.json: ${dossierBytes} bytes`);
