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

	// Parent-pointer BFS: store states and reconstruct path on win
	const states: GameState[] = [initial];
	const parents: number[] = [-1];
	const dirs: Direction[] = ['up']; // placeholder for index 0
	const depths: number[] = [0];

	let head = 0;
	let explored = 0;

	while (head < states.length) {
		const state = states[head];
		const depth = depths[head];
		head++;
		explored++;

		if (depth >= maxDepth) continue;

		for (const dir of DIRECTIONS) {
			const next = tick(state, dir);
			if (!next) continue;

			if (next.status === 'won') {
				// Reconstruct path
				const solution: Direction[] = [dir];
				let idx = head - 1;
				while (parents[idx] !== -1) {
					solution.push(dirs[idx]);
					idx = parents[idx];
				}
				solution.reverse();
				return { solution, explored };
			}

			if (next.status === 'lost') continue;

			const hash = hashState(next);
			if (visited.has(hash)) continue;
			visited.add(hash);

			const newIdx = states.length;
			states.push(next);
			parents.push(head - 1);
			dirs.push(dir);
			depths.push(depth + 1);
		}
	}

	return null;
}
