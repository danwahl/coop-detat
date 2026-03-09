import type { Guard, Camera, Direction } from './types.js';

export function facingFromPositions(
	from: { x: number; y: number },
	to: { x: number; y: number }
): Direction {
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	if (Math.abs(dx) > Math.abs(dy)) {
		return dx > 0 ? 'right' : 'left';
	}
	return dy > 0 ? 'down' : 'up';
}

function advanceIndex(
	index: number,
	direction: 1 | -1,
	length: number,
	mode: 'pace' | 'loop'
): { index: number; direction: 1 | -1 } {
	let next = index + direction;
	let newDir = direction;

	if (mode === 'pace') {
		if (next >= length) {
			next = length - 2;
			newDir = -1 as 1 | -1;
		} else if (next < 0) {
			next = 1;
			newDir = 1 as 1 | -1;
		}
	} else {
		// loop
		if (next >= length) {
			next = 0;
		} else if (next < 0) {
			next = length - 1;
		}
	}

	return { index: next, direction: newDir };
}

export function tickGuards(guards: Guard[]): Guard[] {
	return guards.map((guard) => {
		if (guard.path.length <= 1) return guard;
		const prev = guard.path[guard.pathIndex];
		const { index, direction } = advanceIndex(
			guard.pathIndex,
			guard.pathDirection,
			guard.path.length,
			guard.patrolMode
		);
		const curr = guard.path[index];
		return {
			...guard,
			pathIndex: index,
			pathDirection: direction,
			facing: facingFromPositions(prev, curr)
		};
	});
}

export function tickCameras(cameras: Camera[]): Camera[] {
	return cameras.map((camera) => {
		if (camera.patrolMode === 'fixed') return camera;
		const { index, direction } = advanceIndex(
			camera.dirIndex,
			camera.dirDirection,
			camera.directions.length,
			camera.patrolMode
		);
		return {
			...camera,
			dirIndex: index,
			dirDirection: direction
		};
	});
}
