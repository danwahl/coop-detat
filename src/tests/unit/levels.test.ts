import { describe, it, expect } from 'vitest';
import { levels, secretLevel } from '$lib/levels/index.js';
import { validateLevel } from '$lib/engine/level.js';
import { solve } from '$lib/engine/solver.js';

const allLevels = [...levels, secretLevel];

describe('bundled levels', () => {
	for (const level of allLevels) {
		describe(level.name, () => {
			it('passes validation with no errors', () => {
				const errors = validateLevel(level);
				expect(errors).toEqual([]);
			});

			it('is solvable', () => {
				if (!level.par) return;
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
