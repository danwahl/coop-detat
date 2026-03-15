import type { Direction, GameState, Position } from './types.js';
import { cloneState } from './state.js';
import { movePlayer, canMove as canMovePlayer } from './movement.js';

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];
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
	if (state.status === 'exiting') return true;
	return state.status === 'playing' && canMovePlayer(state, direction);
}

function exitTick(state: GameState): GameState {
	const next = cloneState(state);

	// Head entity goes through the door.
	// Each remaining entity advances to the position of the one ahead.
	const newSnake: Position[] = [];
	for (let i = 1; i < next.snake.length; i++) {
		newSnake.push({ ...next.snake[i - 1] });
	}
	next.snake = newSnake;

	// Update playerPos to track the new head (or keep at exit if empty)
	if (newSnake.length > 0) {
		next.playerPos = { ...newSnake[0] };
	}

	// Guards and cameras still tick
	next.guards = tickGuards(next.guards);
	next.cameras = tickCameras(next.cameras);

	// Detection on remaining snake
	if (isDetected(next)) {
		next.status = 'lost';
		next.lostReason = 'caught';
	} else if (next.snake.length === 0) {
		next.status = 'won';
	}

	next.turnNumber++;
	return next;
}

export function tick(state: GameState, direction: Direction): GameState | null {
	if (state.status === 'exiting') {
		return exitTick(state);
	}

	const moved = movePlayer(state, direction);
	if (!moved) return null;

	const next = moved;
	next.guards = tickGuards(next.guards);
	next.cameras = tickCameras(next.cameras);

	if (isDetected(next)) {
		next.status = 'lost';
		next.lostReason = 'caught';
	} else if (isCageTheftDetected(state, next)) {
		next.status = 'lost';
		next.lostReason = 'caught';
	} else if (
		allCagesCollected(next) &&
		next.playerPos.x === next.level.exit.x &&
		next.playerPos.y === next.level.exit.y
	) {
		if (next.snake.length <= 1) {
			next.status = 'won';
		} else {
			next.status = 'exiting';
		}
	} else if (DIRECTIONS.every((dir) => !canMovePlayer(next, dir))) {
		next.status = 'lost';
		next.lostReason = 'stuck';
	}

	next.turnNumber++;
	return next;
}
