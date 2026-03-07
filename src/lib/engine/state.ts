import type { LevelDef, GameState } from './types.js';

function deepClone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

export function createGameState(level: LevelDef): GameState {
	return {
		level: deepClone(level),
		playerPos: { ...level.playerStart },
		snake: [{ ...level.playerStart }],
		guards: deepClone(level.guards),
		cameras: deepClone(level.cameras),
		collectedCages: [],
		pendingChicken: false,
		turnNumber: 0,
		status: 'playing'
	};
}

export function cloneState(state: GameState): GameState {
	return deepClone(state);
}

export function hashState(state: GameState): string {
	const parts: string[] = [
		`${state.playerPos.x},${state.playerPos.y}`,
		state.snake.map((p) => `${p.x},${p.y}`).join(';'),
		state.guards.map((g) => `${g.pathIndex},${g.pathDirection}`).join(';'),
		state.cameras.map((c) => `${c.dirIndex},${c.dirDirection}`).join(';'),
		state.collectedCages.map((p) => `${p.x},${p.y}`).join(';'),
		state.pendingChicken ? '1' : '0'
	];
	return parts.join('|');
}
