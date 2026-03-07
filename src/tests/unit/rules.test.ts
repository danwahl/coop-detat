import { describe, it, expect } from 'vitest';
import { tick, canMove } from '$lib/engine/rules.js';
import { createGameState } from '$lib/engine/state.js';
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

describe('tick', () => {
	it('resolves a full turn (player + guards)', () => {
		const guard: Guard = {
			id: 'g1', path: [{ x: 0, y: 0 }, { x: 0, y: 3 }], pathIndex: 0,
			pathDirection: 1, patrolMode: 'pace', facing: 'down', visionRange: 3
		};
		const level = makeLevel(8, 8);
		level.guards = [guard];
		const state = createGameState(level);
		const next = tick(state, 'right')!;
		expect(next.playerPos).toEqual({ x: 2, y: 1 });
		expect(next.guards[0].pathIndex).toBe(1);
		expect(next.turnNumber).toBe(1);
	});

	it('returns null for invalid move', () => {
		const level = makeLevel(5, 5, { '2,1': 'wall' });
		const state = createGameState(level);
		expect(tick(state, 'right')).toBeNull();
	});
});

describe('win condition', () => {
	it('wins when all cages collected and on exit', () => {
		// Cage at (2,1), exit at (3,1). Player at (1,1).
		// Move right to (2,1) — blocked (cage). Need cage adjacent.
		// Cage at (2,0), exit at (3,1). Player at (1,1).
		// Move right to (2,1), adj up is (2,0)=cage. Pickup. Move right to (3,1)=exit, snake grows.
		const level = makeLevel(5, 5, { '2,0': 'cage' });
		level.exit = { x: 3, y: 1 };
		let state = createGameState(level);

		state = tick(state, 'right')!; // (2,1), picks up cage at (2,0)
		expect(state.pendingChicken).toBe(true);

		state = tick(state, 'right')!; // (3,1) = exit, all cages collected
		expect(state.status).toBe('won');
	});
});

describe('lose condition', () => {
	it('loses when detected by guard', () => {
		const guard: Guard = {
			id: 'g1', path: [{ x: 0, y: 1 }], pathIndex: 0, pathDirection: 1,
			patrolMode: 'pace', facing: 'right', visionRange: 5
		};
		const level = makeLevel(8, 8);
		level.guards = [guard];
		level.playerStart = { x: 3, y: 2 };
		let state = createGameState(level);

		// Move down to (3,1)? No, down from (3,2) is (3,3). Need to get to y=1.
		// Move up to (3,1) — guard at (0,1) facing right, range 5, sees (1,1)..(5,1) including (3,1)
		state = tick(state, 'up')!;
		expect(state.status).toBe('lost');
	});
});

describe('canMove', () => {
	it('returns false after game is won', () => {
		const level = makeLevel(5, 5);
		const state = createGameState(level);
		state.status = 'won';
		expect(canMove(state, 'right')).toBe(false);
	});
});

describe('full level playthrough', () => {
	it('can play a sequence of moves to win', () => {
		// Simple level: player at (1,1), cage at (1,0), exit at (2,1)
		// Move up adj? No, (1,0) is cage so can't move there.
		// Player at (1,2), cage at (1,0), exit at (3,2).
		// Move up to (1,1), adj up=(1,0)=cage -> pickup.
		// Move right to (2,1), snake grows.
		// Move right to (3,1).
		// Move down to (3,2)=exit, all cages collected -> win.
		const level = makeLevel(5, 5, { '1,0': 'cage' });
		level.playerStart = { x: 1, y: 2 };
		level.exit = { x: 3, y: 2 };
		let state = createGameState(level);

		state = tick(state, 'up')!;    // (1,1), picks up cage
		state = tick(state, 'right')!; // (2,1), snake grows to 2
		state = tick(state, 'right')!; // (3,1)
		state = tick(state, 'down')!;  // (3,2) = exit
		expect(state.status).toBe('won');
		expect(state.turnNumber).toBe(4);
	});
});

describe('undo logic', () => {
	it('can simulate undo by keeping prior states', () => {
		const level = makeLevel(5, 5);
		const state = createGameState(level);
		const stack = [state];

		const s1 = tick(state, 'right')!;
		stack.push(s1);

		const s2 = tick(s1, 'down')!;
		stack.push(s2);

		// Undo
		stack.pop();
		const undone = stack[stack.length - 1];
		expect(undone.playerPos).toEqual({ x: 2, y: 1 });
	});
});
