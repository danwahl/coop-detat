import { describe, it, expect } from 'vitest';
import { getVisibleCells, isDetected } from '$lib/engine/detection.js';
import { createGameState } from '$lib/engine/state.js';
import type { LevelDef, Guard, Camera } from '$lib/engine/types.js';

function makeLevel(width: number, height: number, overrides: Record<string, string> = {}): LevelDef {
	const grid = Array.from({ length: height }, (_, y) =>
		Array.from({ length: width }, (_, x) => {
			const key = `${x},${y}`;
			return (overrides[key] as 'empty' | 'wall' | 'cage' | 'exit') ?? 'empty';
		})
	);
	return {
		id: 'test', name: 'Test', width, height, grid,
		playerStart: { x: 0, y: 0 }, guards: [], cameras: [], exit: { x: width - 1, y: height - 1 }
	};
}

describe('getVisibleCells', () => {
	it('sees correct range in open space', () => {
		const state = createGameState(makeLevel(10, 10));
		const visible = getVisibleCells({ x: 2, y: 5 }, 'right', 3, state);
		expect(visible).toEqual([{ x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }]);
	});

	it('stops at wall', () => {
		const state = createGameState(makeLevel(10, 10, { '4,5': 'wall' }));
		const visible = getVisibleCells({ x: 2, y: 5 }, 'right', 5, state);
		expect(visible).toEqual([{ x: 3, y: 5 }]);
	});

	it('stops at cage', () => {
		const state = createGameState(makeLevel(10, 10, { '4,5': 'cage' }));
		const visible = getVisibleCells({ x: 2, y: 5 }, 'right', 5, state);
		expect(visible).toEqual([{ x: 3, y: 5 }]);
	});

	it('stops at grid edge', () => {
		const state = createGameState(makeLevel(5, 5));
		const visible = getVisibleCells({ x: 3, y: 2 }, 'right', 10, state);
		expect(visible).toEqual([{ x: 4, y: 2 }]);
	});

	it('works in all directions', () => {
		const state = createGameState(makeLevel(10, 10));
		expect(getVisibleCells({ x: 5, y: 5 }, 'up', 2, state)).toEqual([{ x: 5, y: 4 }, { x: 5, y: 3 }]);
		expect(getVisibleCells({ x: 5, y: 5 }, 'down', 2, state)).toEqual([{ x: 5, y: 6 }, { x: 5, y: 7 }]);
		expect(getVisibleCells({ x: 5, y: 5 }, 'left', 2, state)).toEqual([{ x: 4, y: 5 }, { x: 3, y: 5 }]);
	});
});

describe('isDetected', () => {
	it('detects snake head in guard vision', () => {
		const guard: Guard = {
			id: 'g1', path: [{ x: 0, y: 5 }], pathIndex: 0, pathDirection: 1,
			patrolMode: 'pace', facing: 'right', visionRange: 5
		};
		const level = makeLevel(10, 10);
		level.guards = [guard];
		const state = createGameState(level);
		state.playerPos = { x: 3, y: 5 };
		state.snake = [{ x: 3, y: 5 }];
		expect(isDetected(state)).toBe(true);
	});

	it('detects snake tail (not just head)', () => {
		const guard: Guard = {
			id: 'g1', path: [{ x: 0, y: 5 }], pathIndex: 0, pathDirection: 1,
			patrolMode: 'pace', facing: 'right', visionRange: 5
		};
		const level = makeLevel(10, 10);
		level.guards = [guard];
		const state = createGameState(level);
		state.playerPos = { x: 3, y: 3 };
		state.snake = [{ x: 3, y: 3 }, { x: 3, y: 4 }, { x: 3, y: 5 }];
		expect(isDetected(state)).toBe(true);
	});

	it('no detection when snake is outside range', () => {
		const guard: Guard = {
			id: 'g1', path: [{ x: 0, y: 5 }], pathIndex: 0, pathDirection: 1,
			patrolMode: 'pace', facing: 'right', visionRange: 2
		};
		const level = makeLevel(10, 10);
		level.guards = [guard];
		const state = createGameState(level);
		state.playerPos = { x: 5, y: 5 };
		state.snake = [{ x: 5, y: 5 }];
		expect(isDetected(state)).toBe(false);
	});

	it('no detection when wall blocks LOS', () => {
		const guard: Guard = {
			id: 'g1', path: [{ x: 0, y: 5 }], pathIndex: 0, pathDirection: 1,
			patrolMode: 'pace', facing: 'right', visionRange: 5
		};
		const level = makeLevel(10, 10, { '2,5': 'wall' });
		level.guards = [guard];
		const state = createGameState(level);
		state.playerPos = { x: 3, y: 5 };
		state.snake = [{ x: 3, y: 5 }];
		expect(isDetected(state)).toBe(false);
	});

	it('guard facing matters (cannot see behind)', () => {
		const guard: Guard = {
			id: 'g1', path: [{ x: 5, y: 5 }], pathIndex: 0, pathDirection: 1,
			patrolMode: 'pace', facing: 'right', visionRange: 5
		};
		const level = makeLevel(10, 10);
		level.guards = [guard];
		const state = createGameState(level);
		state.playerPos = { x: 3, y: 5 };
		state.snake = [{ x: 3, y: 5 }];
		expect(isDetected(state)).toBe(false); // player is to the left
	});

	it('detects player on guard own cell', () => {
		const guard: Guard = {
			id: 'g1', path: [{ x: 3, y: 5 }], pathIndex: 0, pathDirection: 1,
			patrolMode: 'pace', facing: 'right', visionRange: 3
		};
		const level = makeLevel(10, 10);
		level.guards = [guard];
		const state = createGameState(level);
		state.playerPos = { x: 3, y: 5 };
		state.snake = [{ x: 3, y: 5 }];
		expect(isDetected(state)).toBe(true);
	});

	it('detects snake tail on guard own cell', () => {
		const guard: Guard = {
			id: 'g1', path: [{ x: 3, y: 5 }], pathIndex: 0, pathDirection: 1,
			patrolMode: 'pace', facing: 'right', visionRange: 3
		};
		const level = makeLevel(10, 10);
		level.guards = [guard];
		const state = createGameState(level);
		state.playerPos = { x: 3, y: 3 };
		state.snake = [{ x: 3, y: 3 }, { x: 3, y: 4 }, { x: 3, y: 5 }];
		expect(isDetected(state)).toBe(true);
	});

	it('detects player on camera own cell', () => {
		const camera: Camera = {
			id: 'c1', pos: { x: 5, y: 3 }, directions: ['down'], dirIndex: 0,
			dirDirection: 1, patrolMode: 'fixed', visionRange: 5
		};
		const level = makeLevel(10, 10);
		level.cameras = [camera];
		const state = createGameState(level);
		state.playerPos = { x: 5, y: 3 };
		state.snake = [{ x: 5, y: 3 }];
		expect(isDetected(state)).toBe(true);
	});

	it('detects via camera', () => {
		const camera: Camera = {
			id: 'c1', pos: { x: 5, y: 0 }, directions: ['down'], dirIndex: 0,
			dirDirection: 1, patrolMode: 'fixed', visionRange: 5
		};
		const level = makeLevel(10, 10);
		level.cameras = [camera];
		const state = createGameState(level);
		state.playerPos = { x: 5, y: 3 };
		state.snake = [{ x: 5, y: 3 }];
		expect(isDetected(state)).toBe(true);
	});
});
