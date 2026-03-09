import type { Direction, Position, GameState } from './types.js';

const DIRECTION_VECTORS: Record<Direction, Position> = {
	up: { x: 0, y: -1 },
	down: { x: 0, y: 1 },
	left: { x: -1, y: 0 },
	right: { x: 1, y: 0 }
};

export function getVisibleCells(
	pos: Position,
	facing: Direction,
	range: number,
	state: GameState
): Position[] {
	const vec = DIRECTION_VECTORS[facing];
	const visible: Position[] = [];
	for (let i = 1; i <= range; i++) {
		const x = pos.x + vec.x * i;
		const y = pos.y + vec.y * i;
		if (x < 0 || y < 0 || x >= state.level.width || y >= state.level.height) break;
		const cell = state.level.grid[y][x];
		if (cell === 'wall') break;
		visible.push({ x, y });
	}
	return visible;
}

export function isDetected(state: GameState): boolean {
	const snakeSet = new Set(state.snake.map((p) => `${p.x},${p.y}`));

	for (const guard of state.guards) {
		const pos = guard.path[guard.pathIndex];
		if (snakeSet.has(`${pos.x},${pos.y}`)) return true;
		const visible = getVisibleCells(pos, guard.facing, guard.visionRange, state);
		if (visible.some((v) => snakeSet.has(`${v.x},${v.y}`))) return true;
	}

	for (const camera of state.cameras) {
		if (snakeSet.has(`${camera.pos.x},${camera.pos.y}`)) return true;
		const facing = camera.directions[camera.dirIndex];
		const visible = getVisibleCells(camera.pos, facing, camera.visionRange, state);
		if (visible.some((v) => snakeSet.has(`${v.x},${v.y}`))) return true;
	}

	return false;
}
