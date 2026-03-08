import type { LevelDef, GameState } from './types.js';
import { expandPath } from './path.js';

function deepClone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

export function createGameState(level: LevelDef): GameState {
	const guards = deepClone(level.guards).map((g) => ({
		...g,
		path: expandPath(g.path, g.patrolMode === 'loop')
	}));
	return {
		level: deepClone(level),
		playerPos: { ...level.playerStart },
		snake: [{ ...level.playerStart }],
		guards,
		cameras: deepClone(level.cameras),
		collectedCages: [],
		pendingChicken: false,
		turnNumber: 0,
		status: 'playing'
	};
}

export function cloneState(state: GameState): GameState {
	return {
		level: state.level,
		playerPos: { ...state.playerPos },
		snake: state.snake.map(p => ({ ...p })),
		guards: state.guards.map(g => ({ ...g })),
		cameras: state.cameras.map(c => ({ ...c })),
		collectedCages: state.collectedCages.map(p => ({ ...p })),
		pendingChicken: state.pendingChicken,
		turnNumber: state.turnNumber,
		status: state.status
	};
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
