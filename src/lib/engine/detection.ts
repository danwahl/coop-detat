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

export function isCageTheftDetected(prevState: GameState, nextState: GameState): boolean {
	const prevCollected = new Set(
		prevState.collectedCages.map(p => `${p.x},${p.y}`)
	);
	const newlyCollected = nextState.collectedCages.filter(
		p => !prevCollected.has(`${p.x},${p.y}`)
	);

	if (newlyCollected.length === 0) return false;

	for (const cage of newlyCollected) {
		for (let i = 0; i < prevState.guards.length; i++) {
			const prevGuard = prevState.guards[i];
			const nextGuard = nextState.guards[i];

			const prevPos = prevGuard.path[prevGuard.pathIndex];
			const prevVisible = getVisibleCells(prevPos, prevGuard.facing, prevGuard.visionRange, prevState);
			if (!prevVisible.some(v => v.x === cage.x && v.y === cage.y)) continue;

			const nextPos = nextGuard.path[nextGuard.pathIndex];
			const nextVisible = getVisibleCells(nextPos, nextGuard.facing, nextGuard.visionRange, nextState);
			if (nextVisible.some(v => v.x === cage.x && v.y === cage.y)) return true;
		}

		for (let i = 0; i < prevState.cameras.length; i++) {
			const prevCam = prevState.cameras[i];
			const nextCam = nextState.cameras[i];

			const prevFacing = prevCam.directions[prevCam.dirIndex];
			const prevVisible = getVisibleCells(prevCam.pos, prevFacing, prevCam.visionRange, prevState);
			if (!prevVisible.some(v => v.x === cage.x && v.y === cage.y)) continue;

			const nextFacing = nextCam.directions[nextCam.dirIndex];
			const nextVisible = getVisibleCells(nextCam.pos, nextFacing, nextCam.visionRange, nextState);
			if (nextVisible.some(v => v.x === cage.x && v.y === cage.y)) return true;
		}
	}

	return false;
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
