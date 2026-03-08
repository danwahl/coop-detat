import { describe, it, expect } from 'vitest';
import { movePlayer, canMove } from '$lib/engine/movement.js';
import { createGameState } from '$lib/engine/state.js';
import type { LevelDef } from '$lib/engine/types.js';

function makeLevelGrid(width: number, height: number, overrides: Record<string, string> = {}): LevelDef {
	const grid = Array.from({ length: height }, (_, y) =>
		Array.from({ length: width }, (_, x) => {
			const key = `${x},${y}`;
			return (overrides[key] as 'empty' | 'wall' | 'cage' | 'exit') ?? 'empty';
		})
	);
	return {
		id: 'test',
		name: 'Test',
		width,
		height,
		grid,
		playerStart: { x: 2, y: 2 },
		guards: [],
		cameras: [],
		exit: { x: 4, y: 4 }
	};
}

describe('basic movement', () => {
	it('moves player on empty grid', () => {
		const level = makeLevelGrid(5, 5);
		const state = createGameState(level);
		const next = movePlayer(state, 'right');
		expect(next).not.toBeNull();
		expect(next!.playerPos).toEqual({ x: 3, y: 2 });
		expect(next!.snake).toEqual([{ x: 3, y: 2 }]);
	});

	it('rejects move into wall', () => {
		const level = makeLevelGrid(5, 5, { '3,2': 'wall' });
		const state = createGameState(level);
		expect(canMove(state, 'right')).toBe(false);
		expect(movePlayer(state, 'right')).toBeNull();
	});

	it('rejects move out of bounds', () => {
		const level = makeLevelGrid(5, 5);
		level.playerStart = { x: 0, y: 0 };
		const state = createGameState(level);
		expect(canMove(state, 'left')).toBe(false);
		expect(canMove(state, 'up')).toBe(false);
	});

	it('rejects move into cage', () => {
		const level = makeLevelGrid(5, 5, { '3,2': 'cage' });
		const state = createGameState(level);
		expect(canMove(state, 'right')).toBe(false);
	});

	it('does not modify original state', () => {
		const level = makeLevelGrid(5, 5);
		const state = createGameState(level);
		movePlayer(state, 'right');
		expect(state.playerPos).toEqual({ x: 2, y: 2 });
	});
});

describe('snake body follows', () => {
	it('snake length 2 follows correctly', () => {
		// Cage at (4,2), player starts at (3,3). Move up to (3,2) — right adj is (4,2) cage.
		const level = makeLevelGrid(7, 7, { '4,2': 'cage' });
		level.playerStart = { x: 3, y: 3 };
		let state = createGameState(level);

		// Move up to (3,2): adjacent to cage at (4,2) via right
		state = movePlayer(state, 'up')!;
		expect(state.pendingChicken).toBe(true);
		expect(state.collectedCages).toEqual([{ x: 4, y: 2 }]);

		// Move up: snake grows (can't go right — cage blocks)
		state = movePlayer(state, 'up')!;
		expect(state.snake).toHaveLength(2);
		expect(state.snake[0]).toEqual({ x: 3, y: 1 }); // head
		expect(state.snake[1]).toEqual({ x: 3, y: 2 }); // body
		expect(state.pendingChicken).toBe(false);
	});

	it('snake length 3 follows correctly', () => {
		const level = makeLevelGrid(9, 9, { '4,4': 'cage', '6,4': 'cage' });
		level.playerStart = { x: 3, y: 4 };
		let state = createGameState(level);

		// Move right to (4,4) adj - picks up cage at (4,4)? No, (4,4) is cage, can't move there
		// Move right to (4,4) - blocked. Let's adjust.
		// Player at (3,4), cage at (4,4). Moving down to (3,5) — adjacent to nothing.
		// Let's rethink: player at (3,4). Cage at (4,3).
		const level2 = makeLevelGrid(9, 9, { '4,3': 'cage', '6,3': 'cage' });
		level2.playerStart = { x: 3, y: 3 };
		state = createGameState(level2);

		// Move right to (4,3) — blocked (cage). Move up to (3,2), adjacent to cage at (4,3)? No, not adjacent.
		// Rethink: cage adjacency is checked after moving to new position.
		// Player at (3,3). Cage at (4,4). Move down to (3,4) — adjacent to (4,4) cage.
		const level3 = makeLevelGrid(9, 9, { '4,4': 'cage', '4,6': 'cage' });
		level3.playerStart = { x: 3, y: 3 };
		state = createGameState(level3);

		// Move down to (3,4) — adjacent to (4,4) via right
		state = movePlayer(state, 'down')!;
		expect(state.pendingChicken).toBe(true);

		// Move down to (3,5) — snake grows to 2
		state = movePlayer(state, 'down')!;
		expect(state.snake).toHaveLength(2);
		// Adjacent to (4,6)? No, at (3,5), right is (4,5), not cage. down adj is (3,6), not cage.
		// Adjacent to (4,6)? Only from (3,6). Let's continue.

		// Move down to (3,6) — adjacent to (4,6) cage
		state = movePlayer(state, 'down')!;
		expect(state.snake).toHaveLength(2);
		expect(state.pendingChicken).toBe(true);

		// Move down to (3,7) — snake grows to 3
		state = movePlayer(state, 'down')!;
		expect(state.snake).toHaveLength(3);
		expect(state.snake[0]).toEqual({ x: 3, y: 7 });
		expect(state.snake[1]).toEqual({ x: 3, y: 6 });
		expect(state.snake[2]).toEqual({ x: 3, y: 5 });
	});
});

describe('cannot walk onto own body', () => {
	it('rejects move onto snake body', () => {
		const level = makeLevelGrid(9, 9, { '2,4': 'cage' });
		level.playerStart = { x: 3, y: 4 };
		let state = createGameState(level);

		// Adjacent to cage (2,4) via left — pick up chicken
		// Wait, player is at (3,4), left adj is (2,4) = cage. Check: after moving to (3,4)?
		// Player starts at (3,4). The ADJACENCY_ORDER check happens after moving.
		// But (3,4) is the start pos, not after a move. Let's move first.

		// Move right to (4,4). Adjacent: up=(4,3) empty, right=(5,4) empty, down=(4,5) empty, left=(3,4) empty. No cage.
		// We need the cage adjacent to where we move. Let's use cage at (5,3).
		const level2 = makeLevelGrid(9, 9, { '5,3': 'cage', '5,5': 'cage' });
		level2.playerStart = { x: 4, y: 3 };
		state = createGameState(level2);

		// At (4,3). Right adj is (5,3) = cage. Already adjacent at start? No — adjacency check only after movePlayer.
		// Move down to (4,4). Adj: up=(4,3) empty, right=(5,4) empty, down=(4,5) empty, left=(3,4) empty. No cage adj.
		// Hmm. Let's just build a snake manually for this test.

		// Build a state with a length-3 snake going right
		state.snake = [
			{ x: 4, y: 3 },
			{ x: 3, y: 3 },
			{ x: 2, y: 3 }
		];
		state.playerPos = { x: 4, y: 3 };

		// Try to move left — blocked by own body at (3,3)
		expect(canMove(state, 'left')).toBe(false);
		expect(movePlayer(state, 'left')).toBeNull();
	});

	it('allows moving onto tail position (tail moves away)', () => {
		const level = makeLevelGrid(9, 9);
		let state = createGameState(level);

		// Snake of length 3 in an L shape: head at (4,3), body at (4,4), tail at (3,4)
		state.snake = [
			{ x: 4, y: 3 },
			{ x: 4, y: 4 },
			{ x: 3, y: 4 }
		];
		state.playerPos = { x: 4, y: 3 };

		// Move left to (3,3). Body at (4,4) stays, tail at (3,4) moves to (4,4).
		// Actually: new snake = [newHead, ...old except last] = [(3,3), (4,3), (4,4)]
		// So (3,4) is vacated. Moving left to (3,3) — not blocked by body.
		expect(canMove(state, 'left')).toBe(true);

		// Now test: can we move down to (4,4)? That's where body[1] is.
		// New snake would be [(4,4), (4,3), (4,4)]? No — the tail (3,4) moves away,
		// but (4,4) is body[1] which stays. So blocked.
		expect(canMove(state, 'down')).toBe(false);
	});

	it('blocks reversal at snake length 2', () => {
		const level = makeLevelGrid(9, 9);
		let state = createGameState(level);

		// Snake of length 2 going right: head at (4,3), tail at (3,3)
		state.snake = [
			{ x: 4, y: 3 },
			{ x: 3, y: 3 }
		];
		state.playerPos = { x: 4, y: 3 };

		// Moving left would reverse onto the tail — should be blocked
		expect(canMove(state, 'left')).toBe(false);
		expect(movePlayer(state, 'left')).toBeNull();

		// Other directions should still work
		expect(canMove(state, 'right')).toBe(true);
		expect(canMove(state, 'up')).toBe(true);
		expect(canMove(state, 'down')).toBe(true);
	});
});

describe('chicken pickup', () => {
	it('picks up cage when adjacent after moving', () => {
		// Cage at (3,1), player starts at (2,2), move up to (2,1) — right adj is (3,1) cage
		const level = makeLevelGrid(5, 5, { '3,1': 'cage' });
		level.playerStart = { x: 2, y: 2 };
		const state = createGameState(level);
		const next = movePlayer(state, 'up')!;
		expect(next.pendingChicken).toBe(true);
		expect(next.collectedCages).toEqual([{ x: 3, y: 1 }]);
	});

	it('does not pick up already collected cage', () => {
		const level = makeLevelGrid(5, 5, { '3,1': 'cage' });
		level.playerStart = { x: 2, y: 2 };
		let state = createGameState(level);

		// Pick up cage
		state = movePlayer(state, 'up')!; // (2,1), adj to (3,1)
		expect(state.collectedCages).toHaveLength(1);

		// Move away and back
		state = movePlayer(state, 'left')!; // (1,1), grows snake
		state = movePlayer(state, 'down')!; // (1,2)
		state = movePlayer(state, 'right')!; // (2,2)
		state = movePlayer(state, 'up')!; // (2,1) again, adj to (3,1) but already collected
		expect(state.collectedCages).toHaveLength(1); // Still 1
	});

	it('uses priority order up > right > down > left for multiple adjacent cages', () => {
		// Player moves to (2,2), cages at (2,1) [up] and (3,2) [right]
		const level = makeLevelGrid(5, 5, { '2,1': 'cage', '3,2': 'cage' });
		level.playerStart = { x: 2, y: 3 };
		const state = createGameState(level);
		const next = movePlayer(state, 'up')!; // moves to (2,2)
		// Adjacent cages: up=(2,1) cage, right=(3,2) cage. Priority: up first.
		expect(next.collectedCages).toEqual([{ x: 2, y: 1 }]);
	});
});

describe('status checks', () => {
	it('rejects move when status is won', () => {
		const level = makeLevelGrid(5, 5);
		const state = createGameState(level);
		state.status = 'won';
		expect(movePlayer(state, 'right')).toBeNull();
	});

	it('rejects move when status is lost', () => {
		const level = makeLevelGrid(5, 5);
		const state = createGameState(level);
		state.status = 'lost';
		expect(movePlayer(state, 'right')).toBeNull();
	});
});
