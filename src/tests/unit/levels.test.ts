import { describe, it, expect } from 'vitest';
import { levels } from '$lib/levels/index.js';
import { validateLevel } from '$lib/engine/level.js';
import { solve } from '$lib/engine/solver.js';

describe('bundled levels', () => {
	for (const level of levels) {
		describe(level.name, () => {
			it('passes validation with no errors', () => {
				const errors = validateLevel(level);
				expect(errors).toEqual([]);
			});

			it('is solvable', () => {
				const result = solve(level, 200);
				expect(result).not.toBeNull();
			});

			it('par matches optimal solution', () => {
				if (!level.par) return;
				const result = solve(level, 200);
				expect(result).not.toBeNull();
				expect(result!.solution.length).toBe(level.par);
			});
		});
	}
});
