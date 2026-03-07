import { describe, it, expect } from 'vitest';
import { tickGuards, tickCameras } from '$lib/engine/entities.js';
import type { Guard, Camera } from '$lib/engine/types.js';

function makeGuard(overrides: Partial<Guard> = {}): Guard {
	return {
		id: 'g1',
		path: [
			{ x: 0, y: 0 },
			{ x: 1, y: 0 },
			{ x: 2, y: 0 }
		],
		pathIndex: 0,
		pathDirection: 1,
		patrolMode: 'pace',
		facing: 'right',
		visionRange: 3,
		...overrides
	};
}

function makeCamera(overrides: Partial<Camera> = {}): Camera {
	return {
		id: 'c1',
		pos: { x: 5, y: 5 },
		directions: ['up', 'right', 'down', 'left'],
		dirIndex: 0,
		dirDirection: 1,
		patrolMode: 'pace',
		visionRange: 3,
		...overrides
	};
}

describe('guard pacing', () => {
	it('moves forward along path', () => {
		const guards = tickGuards([makeGuard()]);
		expect(guards[0].pathIndex).toBe(1);
		expect(guards[0].pathDirection).toBe(1);
		expect(guards[0].facing).toBe('right');
	});

	it('reverses at end of path', () => {
		const guard = makeGuard({ pathIndex: 2 });
		const guards = tickGuards([guard]);
		expect(guards[0].pathIndex).toBe(1);
		expect(guards[0].pathDirection).toBe(-1);
		expect(guards[0].facing).toBe('left');
	});

	it('reverses at start of path', () => {
		const guard = makeGuard({ pathIndex: 0, pathDirection: -1 });
		const guards = tickGuards([guard]);
		expect(guards[0].pathIndex).toBe(1);
		expect(guards[0].pathDirection).toBe(1);
		expect(guards[0].facing).toBe('right');
	});

	it('ping-pongs fully', () => {
		let guards = [makeGuard()]; // index 0, dir 1
		// 0->1->2->1->0->1
		guards = tickGuards(guards); // 1
		expect(guards[0].pathIndex).toBe(1);
		guards = tickGuards(guards); // 2
		expect(guards[0].pathIndex).toBe(2);
		guards = tickGuards(guards); // 1 (reversed)
		expect(guards[0].pathIndex).toBe(1);
		expect(guards[0].pathDirection).toBe(-1);
		guards = tickGuards(guards); // 0
		expect(guards[0].pathIndex).toBe(0);
		guards = tickGuards(guards); // 1 (reversed again)
		expect(guards[0].pathIndex).toBe(1);
		expect(guards[0].pathDirection).toBe(1);
	});
});

describe('guard looping', () => {
	it('wraps from last to first', () => {
		const guard = makeGuard({ patrolMode: 'loop', pathIndex: 2 });
		const guards = tickGuards([guard]);
		expect(guards[0].pathIndex).toBe(0);
		expect(guards[0].pathDirection).toBe(1);
	});

	it('cycles correctly', () => {
		let guards = [makeGuard({ patrolMode: 'loop' })];
		guards = tickGuards(guards); // 1
		guards = tickGuards(guards); // 2
		guards = tickGuards(guards); // 0 (wrap)
		expect(guards[0].pathIndex).toBe(0);
	});
});

describe('guard facing with L-shaped path', () => {
	it('updates facing on direction change', () => {
		const guard = makeGuard({
			path: [
				{ x: 0, y: 0 },
				{ x: 2, y: 0 },
				{ x: 2, y: 2 }
			],
			pathIndex: 0
		});
		let guards = tickGuards([guard]);
		expect(guards[0].facing).toBe('right'); // (0,0) -> (2,0)
		guards = tickGuards(guards);
		expect(guards[0].facing).toBe('down'); // (2,0) -> (2,2)
	});
});

describe('camera fixed', () => {
	it('does not change', () => {
		const cam = makeCamera({ patrolMode: 'fixed', directions: ['up'] });
		const cams = tickCameras([cam]);
		expect(cams[0].dirIndex).toBe(0);
	});
});

describe('camera pacing', () => {
	it('cycles directions and reverses', () => {
		let cams = [makeCamera()]; // directions: up, right, down, left
		cams = tickCameras(cams); // 1 (right)
		expect(cams[0].dirIndex).toBe(1);
		cams = tickCameras(cams); // 2 (down)
		cams = tickCameras(cams); // 3 (left)
		expect(cams[0].dirIndex).toBe(3);
		cams = tickCameras(cams); // 2 (reversed)
		expect(cams[0].dirIndex).toBe(2);
		expect(cams[0].dirDirection).toBe(-1);
	});
});

describe('camera looping', () => {
	it('wraps around', () => {
		let cams = [makeCamera({ patrolMode: 'loop' })];
		cams = tickCameras(cams); // 1
		cams = tickCameras(cams); // 2
		cams = tickCameras(cams); // 3
		cams = tickCameras(cams); // 0 (wrap)
		expect(cams[0].dirIndex).toBe(0);
	});
});
