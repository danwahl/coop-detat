import { describe, it, expect } from 'vitest';
import { createGameState, cloneState, hashState } from '$lib/engine/state.js';
import type { LevelDef } from '$lib/engine/types.js';
import sampleLevel from '$lib/levels/sample.json';

describe('createGameState', () => {
	it('creates valid initial state from level', () => {
		const state = createGameState(sampleLevel as LevelDef);
		expect(state.playerPos).toEqual({ x: 1, y: 1 });
		expect(state.snake).toEqual([{ x: 1, y: 1 }]);
		expect(state.guards).toEqual([]);
		expect(state.cameras).toEqual([]);
		expect(state.collectedCages).toEqual([]);
		expect(state.pendingChicken).toBe(false);
		expect(state.turnNumber).toBe(0);
		expect(state.status).toBe('playing');
	});

	it('does not share references with level def', () => {
		const state = createGameState(sampleLevel as LevelDef);
		state.playerPos.x = 99;
		expect(sampleLevel.playerStart.x).toBe(1);
	});
});

describe('cloneState', () => {
	it('creates a deep copy', () => {
		const state = createGameState(sampleLevel as LevelDef);
		const clone = cloneState(state);
		clone.playerPos.x = 99;
		expect(state.playerPos.x).toBe(1);
	});
});

describe('hashState', () => {
	it('produces identical hashes for identical states', () => {
		const a = createGameState(sampleLevel as LevelDef);
		const b = createGameState(sampleLevel as LevelDef);
		expect(hashState(a)).toBe(hashState(b));
	});

	it('produces different hashes for different positions', () => {
		const a = createGameState(sampleLevel as LevelDef);
		const b = createGameState(sampleLevel as LevelDef);
		b.playerPos = { x: 2, y: 2 };
		expect(hashState(a)).not.toBe(hashState(b));
	});
});
