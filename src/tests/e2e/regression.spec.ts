import { test, expect } from '@playwright/test';
import { openLevel, playSolution, getMoveCount, expectStatus } from './helpers.js';

test.describe('Golden Path Regression', () => {
	test('Level 1 golden path (par 6)', async ({ page }) => {
		await openLevel(page, 'level1');
		// Solver solution: up, right, right, right, down, right
		await playSolution(page, ['up', 'right', 'right', 'right', 'down', 'right']);
		await expectStatus(page, 'won');
		expect(await getMoveCount(page)).toBe(6);
	});

	test('Level 2 golden path (par 7)', async ({ page }) => {
		await openLevel(page, 'level2');
		// Solver solution: down, down, right, right, right, right, right
		await playSolution(page, ['down', 'down', 'right', 'right', 'right', 'right', 'right']);
		await expectStatus(page, 'won');
		expect(await getMoveCount(page)).toBe(7);
	});

	test('Level 3 golden path (par 10)', async ({ page }) => {
		await openLevel(page, 'level3');
		// Solver solution: up, up, right, right, right, right, down, down, right, right
		await playSolution(page, ['up', 'up', 'right', 'right', 'right', 'right', 'down', 'down', 'right', 'right']);
		await expectStatus(page, 'won');
		expect(await getMoveCount(page)).toBe(10);
	});
});
