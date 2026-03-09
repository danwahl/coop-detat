# Coop D'etat

A turn-based puzzle game about rescuing chickens from factory farms.

Guide your ninja rescuer through guarded facilities, avoid detection by
cameras and patrolling officers, and lead every chicken to freedom.

## Play

[Play online](https://coop-detat.vercel.app)

## How to Play

- **Arrow keys / WASD** — Move the ninja
- **Z** — Undo last move
- **R** — Restart level
- **Swipe** — Touch controls on mobile

Move adjacent to a cage to free a chicken. Freed chickens follow you in a
line. Avoid being spotted by cameras or guards — they can see in a straight
line in the direction they face. Collect all chickens and reach the exit to
complete the level.

## Development

Built with SvelteKit + TypeScript + SVG.

```sh
npm install
npm run dev          # dev server
npm test             # unit tests (Vitest)
npm run test:e2e     # E2E tests (Playwright)
npm run build        # production build
```

## Level Editor

The built-in level editor lets you create custom levels. Features include
drag-to-paint walls and cages, guard path drawing (click the start cell to
close a loop), camera placement with configurable direction, and a BFS
solver that finds the optimal solution.

## Acknowledgements

Inspired by the work of [Direct Action Everywhere](https://www.directactioneverywhere.com/)
and other animal welfare organizations. The name is a pun on "coup d'etat" —
a chicken coop revolution.

Emoji graphics by [Twemoji](https://github.com/jdecked/twemoji), licensed
under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/).
