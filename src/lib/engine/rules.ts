import type { Direction, GameState } from './types.js';
import { cloneState } from './state.js';
import { movePlayer, canMove as canMovePlayer } from './movement.js';
import { tickGuards, tickCameras } from './entities.js';
import { isDetected, isCageTheftDetected } from './detection.js';

function allCagesCollected(state: GameState): boolean {
	let totalCages = 0;
	for (let y = 0; y < state.level.height; y++) {
		for (let x = 0; x < state.level.width; x++) {
			if (state.level.grid[y][x] === 'cage') totalCages++;
		}
	}
	return state.collectedCages.length >= totalCages;
}

export function canMove(state: GameState, direction: Direction): boolean {
	return state.status === 'playing' && canMovePlayer(state, direction);
}

export function tick(state: GameState, direction: Direction): GameState | null {
	const moved = movePlayer(state, direction);
	if (!moved) return null;

	const next = moved;
	next.guards = tickGuards(next.guards);
	next.cameras = tickCameras(next.cameras);

	if (isDetected(next)) {
		next.status = 'lost';
	} else if (isCageTheftDetected(state, next)) {
		next.status = 'lost';
	} else if (
		allCagesCollected(next) &&
		next.playerPos.x === next.level.exit.x &&
		next.playerPos.y === next.level.exit.y
	) {
		next.status = 'won';
	}

	next.turnNumber++;
	return next;
}
