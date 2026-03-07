import { describe, it, expect } from 'vitest';
import { solve } from '$lib/engine/solver.js';
import type { LevelDef, Guard } from '$lib/engine/types.js';

function makeLevel(width: number, height: number, overrides: Record<string, string> = {}): LevelDef {
	const grid = Array.from({ length: height }, (_, y) =>
		Array.from({ length: width }, (_, x) => {
			const key = `${x},${y}`;
			return (overrides[key] as 'empty' | 'wall' | 'cage' | 'exit') ?? 'empty';
		})
	);
	return {
		id: 'test', name: 'Test', width, height, grid,
		playerStart: { x: 1, y: 1 }, guards: [], cameras: [], exit: { x: width - 2, y: height - 2 }
	};
}

describe('solver', () => {
	it('solves trivial level (1 chicken, no guards)', () => {
		// Player at (1,2), cage at (1,0), exit at (3,2)
		const level = makeLevel(5, 5, { '1,0': 'cage' });
		level.playerStart = { x: 1, y: 2 };
		level.exit = { x: 3, y: 2 };

		const result = solve(level);
		expect(result).not.toBeNull();
		expect(result!.solution.length).toBe(4); // up, right, right, down
	});

	it('returns null for unsolvable level', () => {
		// Exit completely surrounded by walls
		const level = makeLevel(5, 5, {
			'1,0': 'cage',
			'2,2': 'wall', '2,4': 'wall', '4,3': 'wall', '2,3': 'wall', '3,2': 'wall', '3,4': 'wall'
		});
		level.exit = { x: 3, y: 3 };
		const result = solve(level, 20);
		expect(result).toBeNull();
	});

	it('solves level with guard requiring timing', () => {
		// 7x3 corridor. Player at (0,1), exit at (6,1), cage at (0,0)
		// Guard paces (3,1) -> (5,1) facing right, range 2
		const level = makeLevel(7, 3, { '0,0': 'cage' });
		level.playerStart = { x: 0, y: 1 };
		level.exit = { x: 6, y: 1 };
		level.guards = [{
			id: 'g1',
			path: [{ x: 3, y: 1 }, { x: 5, y: 1 }],
			pathIndex: 0,
			pathDirection: 1,
			patrolMode: 'pace',
			facing: 'right',
			visionRange: 2
		}];

		const result = solve(level, 30);
		expect(result).not.toBeNull();
		// Verify solution is actually valid (length > 0)
		expect(result!.solution.length).toBeGreaterThan(0);
	});

	it('solution is optimal', () => {
		// Simple level: player (0,1), cage at (0,0), exit at (2,1)
		// Optimal: move up (adj to cage at (0,0)? No, (0,0) is cage, we're at (0,0) after up?
		// Player at (1,1), cage at (1,0), exit at (2,1).
		// Up to (1,0) blocked (cage). Right to (2,1)=exit but no chicken.
		// Player at (1,2), cage at (2,1)... let me think carefully.
		// Player at (0,1), cage at (1,0), exit at (2,1).
		// Move right to (1,1), adj up=(1,0)=cage -> pickup. Move right to (2,1)=exit. 2 moves.
		const level = makeLevel(4, 3, { '1,0': 'cage' });
		level.playerStart = { x: 0, y: 1 };
		level.exit = { x: 2, y: 1 };
		const result = solve(level);
		expect(result).not.toBeNull();
		expect(result!.solution.length).toBe(2);
	});
});
