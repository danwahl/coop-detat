import { describe, it, expect } from 'vitest';
import { expandPath } from '$lib/engine/path.js';

describe('expandPath', () => {
	it('fills horizontal segment', () => {
		expect(expandPath([{ x: 0, y: 0 }, { x: 3, y: 0 }])).toEqual([
			{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }
		]);
	});

	it('fills vertical segment', () => {
		expect(expandPath([{ x: 4, y: 1 }, { x: 4, y: 3 }])).toEqual([
			{ x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 }
		]);
	});

	it('handles multi-segment L-shaped path', () => {
		expect(expandPath([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }])).toEqual([
			{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }
		]);
	});

	it('handles single-point path', () => {
		expect(expandPath([{ x: 5, y: 5 }])).toEqual([{ x: 5, y: 5 }]);
	});

	it('handles adjacent waypoints (no fill needed)', () => {
		expect(expandPath([{ x: 0, y: 0 }, { x: 1, y: 0 }])).toEqual([
			{ x: 0, y: 0 }, { x: 1, y: 0 }
		]);
	});

	it('throws on diagonal segment', () => {
		expect(() => expandPath([{ x: 0, y: 0 }, { x: 2, y: 3 }])).toThrow('Non-axis-aligned');
	});

	it('handles empty path', () => {
		expect(expandPath([])).toEqual([]);
	});

	it('adds return leg for loop path', () => {
		// Straight line loop: (0,0) → (3,0) → back to (0,0)
		expect(expandPath([{ x: 0, y: 0 }, { x: 3, y: 0 }], true)).toEqual([
			{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
			{ x: 2, y: 0 }, { x: 1, y: 0 }  // return leg excluding start
		]);
	});

	it('loop square path includes all intermediate cells', () => {
		const result = expandPath([
			{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }
		], true);
		expect(result).toEqual([
			{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
			{ x: 2, y: 1 }, { x: 2, y: 2 },
			{ x: 1, y: 2 }, { x: 0, y: 2 },
			{ x: 0, y: 1 }  // return leg from (0,2) back toward (0,0), excluding (0,0)
		]);
	});

	it('loop with same start and end skips return leg', () => {
		expect(expandPath([{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 0 }], true)).toEqual([
			{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }
		]);
	});

	it('non-loop mode ignores loop parameter', () => {
		expect(expandPath([{ x: 0, y: 0 }, { x: 2, y: 0 }], false)).toEqual([
			{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }
		]);
	});
});
