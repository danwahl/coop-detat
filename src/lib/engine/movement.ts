import type { Direction, Position, GameState, CellType } from './types.js';
import { cloneState } from './state.js';

const DIRECTION_VECTORS: Record<Direction, Position> = {
	up: { x: 0, y: -1 },
	down: { x: 0, y: 1 },
	left: { x: -1, y: 0 },
	right: { x: 1, y: 0 }
};

const ADJACENCY_ORDER: Direction[] = ['up', 'right', 'down', 'left'];

function posEqual(a: Position, b: Position): boolean {
	return a.x === b.x && a.y === b.y;
}

function getCell(state: GameState, pos: Position): CellType | null {
	if (pos.x < 0 || pos.y < 0 || pos.x >= state.level.width || pos.y >= state.level.height) {
		return null;
	}
	return state.level.grid[pos.y][pos.x];
}

function isBlocked(state: GameState, pos: Position): boolean {
	const cell = getCell(state, pos);
	if (cell === null || cell === 'wall' || cell === 'cage') return true;
	if (state.cameras.some(c => c.pos.x === pos.x && c.pos.y === pos.y)) return true;
	return false;
}

function isSnakeBody(state: GameState, pos: Position): boolean {
	return state.snake.some((s) => posEqual(s, pos));
}

export function canMove(state: GameState, direction: Direction): boolean {
	const vec = DIRECTION_VECTORS[direction];
	const target = { x: state.playerPos.x + vec.x, y: state.playerPos.y + vec.y };
	if (isBlocked(state, target)) return false;
	// Can't move onto own body (exclude the tail if it will move away)
	// The tail will vacate its cell unless pendingChicken is true (snake grows)
	const tailIndex = state.snake.length - 1;
	for (let i = 1; i < state.snake.length; i++) {
		if (posEqual(state.snake[i], target)) {
			// If this is the tail and no pending chicken, it will move away
			if (i === tailIndex && i > 1 && !state.pendingChicken) continue;
			return false;
		}
	}
	return true;
}

export function movePlayer(state: GameState, direction: Direction): GameState | null {
	if (state.status !== 'playing') return null;
	if (!canMove(state, direction)) return null;

	const next = cloneState(state);
	const vec = DIRECTION_VECTORS[direction];
	const newHead = { x: state.playerPos.x + vec.x, y: state.playerPos.y + vec.y };

	// Update snake: each segment takes the position of the one before it
	const newSnake: Position[] = [newHead];
	const limit = next.pendingChicken ? next.snake.length : next.snake.length - 1;
	for (let i = 0; i < limit; i++) {
		newSnake.push({ ...next.snake[i] });
	}

	next.playerPos = newHead;
	next.snake = newSnake;

	// Clear pending chicken (it was consumed this turn by growing the snake)
	if (next.pendingChicken) {
		next.pendingChicken = false;
	}

	// Check for adjacent cages to collect
	for (const dir of ADJACENCY_ORDER) {
		const adjVec = DIRECTION_VECTORS[dir];
		const adj = { x: newHead.x + adjVec.x, y: newHead.y + adjVec.y };
		const cell = getCell(next, adj);
		if (cell === 'cage' && !next.collectedCages.some((c) => posEqual(c, adj))) {
			next.collectedCages.push({ ...adj });
			next.pendingChicken = true;
			break; // Only one per turn
		}
	}

	return next;
}
