# CLAUDE.md

## Project Overview

Coop D'etat is a turn-based puzzle game about rescuing chickens from factory farms.
Built with SvelteKit + TypeScript + SVG. Deployed to Vercel as a static site.

## Architecture

- **Engine** (`src/lib/engine/`): Pure TypeScript, zero side effects. All game logic
  lives here. Functions take state in, return new state out. No DOM, no Svelte, no globals.
  This is the most testable and most critical part of the codebase.
- **Components** (`src/lib/components/`): Svelte 5 components using runes (`$state`,
  `$derived`, `$effect`). Grid.svelte renders the game board as SVG.
- **Stores** (`src/lib/stores/`): Module-level `$state` in `.svelte.ts` files.
  Must use `.svelte.ts` extension for Svelte 5 reactivity to work.
- **Levels** (`src/lib/levels/`): JSON level definitions. All bundled levels are
  validated and solver-verified by unit tests.

## Key Conventions

- **Svelte 5 runes**: Use `$state`, `$derived`, `$effect` — NOT Svelte 4 stores.
  Store files MUST use `.svelte.ts` extension.
- **Deep cloning**: Use manual spread/map cloning in engine code (see `cloneState`
  in `state.ts`). Avoid `structuredClone` (breaks in some Svelte contexts) and
  `JSON.parse(JSON.stringify())` in hot paths (slow). The `level` reference in
  `GameState` is shared and never mutated — don't clone it.
- **Emoji**: All game entity graphics use Twemoji SVGs in `src/lib/assets/emoji/`,
  rendered as `<image>` elements in SVG. Do NOT use native emoji text — rendering
  varies across platforms.
- **Camera transform**: The Twemoji camera SVG (1f3a5.svg) faces LEFT by default.
  Transforms: left=none, right=scale(-1,1), down=rotate(-90), up=rotate(90).
- **Guard facing**: Always derived from path direction in `createGameState()`.
  The `facing` field in level JSON is ignored at runtime. Don't hardcode it.
- **Path expansion**: Level JSON stores guard paths as sparse waypoints. `expandPath()`
  in `path.ts` interpolates all intermediate cells at load time. Loop guards also
  expand the closing segment back to the start.
- **Validation**: `validateLevel()` in `engine/level.ts` is the single source of truth.
  The editor store delegates to it. All bundled levels are tested against it.
- **Grid stability**: The game grid SVG must NEVER resize during editing or playing.
  Any UI that appears/disappears (config panels, toasts) must not affect the grid
  container's dimensions. Use fixed-height reserved slots, not dynamic padding.

## Commands

```
npm run dev          # dev server (port 5173)
npm test             # unit tests (Vitest, 99+ tests)
npm run test:e2e     # E2E tests (Playwright, requires `npx playwright install`)
npm run check        # svelte-check (type checking + lint)
npm run build        # production build (outputs to build/)
```

## Testing

- Unit tests in `src/tests/unit/`. Engine logic is highly testable — prefer unit tests.
- E2E tests in `src/tests/e2e/`. Use `data-testid` attributes for selectors.
- `levels.test.ts` validates ALL bundled levels (validation + solvability + par).
  Any new level must pass these tests.
- Run `npm test` before committing. Run `npm run check` to catch type errors.

## Git Conventions

- Conventional commits: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`, `perf:`
- Keep commits focused — one logical change per commit.
- CI runs on push: type-check + unit tests + E2E tests.

## Level Design

- Levels are JSON files in `src/lib/levels/`.
- Guard paths are sparse waypoints — `expandPath()` fills in cells at runtime.
- Use the editor's Solve button to find optimal solutions and set par.
- All levels must be registered in `src/lib/levels/index.ts`.
- The `levels.test.ts` suite verifies every level validates, is solvable, and
  has the correct par value. Add new levels → run tests.
- Cages block movement but NOT line of sight (you can see through bars).
- **Cage theft detection**: If an observer (guard/camera) can see a cage on two
  consecutive turns and the chicken disappears between them, the player is caught.
  Fixed cameras watching a cage make that chicken unfreeable from their direction.
- **Exit draining**: When the player reaches the exit with all chickens, the game
  enters 'exiting' phase. Each tick removes the tail chicken (it enters the door).
  Guards/cameras keep moving and detection still applies. Win when snake length = 1.
- Cameras are impassable (block movement like walls).

## Common Pitfalls

- Don't use `structuredClone` — use manual cloning (spread + map).
- Don't use native emoji in SVG `<text>` — use Twemoji `<image>`.
- Don't change grid container dimensions dynamically — causes SVG resize.
- Store files must be `.svelte.ts`, not `.ts`, for reactivity.
- The solver runs on the main thread — keep levels reasonable in size or
  consider Web Worker for very large grids.
