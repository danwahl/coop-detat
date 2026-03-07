import type { Direction, LevelDef, GameState } from './types.js';
import { createGameState, hashState } from './state.js';
import { tick } from './rules.js';

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

export type SolveResult = {
	solution: Direction[];
	explored: number;
};

export function solve(level: LevelDef, maxDepth: number = 200): SolveResult | null {
	const initial = createGameState(level);
	const visited = new Set<string>();
	visited.add(hashState(initial));

	const queue: { state: GameState; moves: Direction[] }[] = [{ state: initial, moves: [] }];

	let explored = 0;

	while (queue.length > 0) {
		const { state, moves } = queue.shift()!;
		explored++;

		if (moves.length >= maxDepth) continue;

		for (const dir of DIRECTIONS) {
			const next = tick(state, dir);
			if (!next) continue;

			if (next.status === 'won') {
				return { solution: [...moves, dir], explored };
			}

			if (next.status === 'lost') continue;

			const hash = hashState(next);
			if (visited.has(hash)) continue;
			visited.add(hash);

			queue.push({ state: next, moves: [...moves, dir] });
		}
	}

	return null;
}
