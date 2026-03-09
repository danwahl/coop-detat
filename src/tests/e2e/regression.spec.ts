import { test, expect } from '@playwright/test';
import { openLevel, playSolution, getMoveCount, expectStatus, drainExit } from './helpers.js';

test.describe('Golden Path Regression', () => {
	test('Level 1 golden path (par 8)', async ({ page }) => {
		await openLevel(page, 'level1');
		await playSolution(page, ['up', 'right', 'right', 'right', 'down', 'right']);
		await drainExit(page, 2); // 1 chicken + ninja
		await expectStatus(page, 'won');
		expect(await getMoveCount(page)).toBe(8);
	});

	test('Level 2 golden path (par 9)', async ({ page }) => {
		await openLevel(page, 'level2');
		await playSolution(page, ['down', 'down', 'right', 'right', 'right', 'right', 'right']);
		await drainExit(page, 2); // 1 chicken + ninja
		await expectStatus(page, 'won');
		expect(await getMoveCount(page)).toBe(9);
	});

	test('Level 3 golden path (par 13)', async ({ page }) => {
		await openLevel(page, 'level3');
		await playSolution(page, ['up', 'up', 'right', 'right', 'right', 'right', 'down', 'down', 'right', 'right']);
		await drainExit(page, 3); // 2 chickens + ninja
		await expectStatus(page, 'won');
		expect(await getMoveCount(page)).toBe(13);
	});
});
