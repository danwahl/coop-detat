import { test, expect } from '@playwright/test';
import { openLevel, pressDirection, getMoveCount, expectStatus, playSolution } from './helpers.js';

test.describe('Core Gameplay (Level 1)', () => {
	test.beforeEach(async ({ page }) => {
		await openLevel(page, 'level1');
	});

	test('arrow key moves player', async ({ page }) => {
		await pressDirection(page, 'right');
		expect(await getMoveCount(page)).toBe(1);
	});

	test('WASD also works', async ({ page }) => {
		await page.keyboard.press('d');
		expect(await getMoveCount(page)).toBe(1);
	});

	test('invalid move is rejected', async ({ page }) => {
		await pressDirection(page, 'left'); // into wall at (0,2)
		expect(await getMoveCount(page)).toBe(0);
	});

	test('win condition triggers', async ({ page }) => {
		// Level 1 solution: par 6 — up, right, right, right, down, right
		// Player at (1,2), cage at (3,2), exit at (5,2)
		// up to (1,1), right to (2,1) adj (3,1)? No... let me use the known solution
		await playSolution(page, ['up', 'right', 'right', 'right', 'down', 'right']);
		await expectStatus(page, 'won');
	});

	test('cannot move after winning', async ({ page }) => {
		await playSolution(page, ['up', 'right', 'right', 'right', 'down', 'right']);
		await expectStatus(page, 'won');
		const count = await getMoveCount(page);
		await pressDirection(page, 'right');
		expect(await getMoveCount(page)).toBe(count);
	});

	test('undo works with z key', async ({ page }) => {
		await pressDirection(page, 'right');
		expect(await getMoveCount(page)).toBe(1);
		await page.keyboard.press('z');
		expect(await getMoveCount(page)).toBe(0);
	});

	test('multi-step undo', async ({ page }) => {
		await pressDirection(page, 'up');
		await pressDirection(page, 'down');
		await pressDirection(page, 'up');
		expect(await getMoveCount(page)).toBe(3);
		await page.keyboard.press('z');
		await page.keyboard.press('z');
		await page.keyboard.press('z');
		expect(await getMoveCount(page)).toBe(0);
	});

	test('restart works with r key', async ({ page }) => {
		await pressDirection(page, 'right');
		await pressDirection(page, 'right');
		await page.keyboard.press('r');
		expect(await getMoveCount(page)).toBe(0);
	});

	test('undo button works', async ({ page }) => {
		await pressDirection(page, 'right');
		await page.getByTestId('undo-button').click();
		expect(await getMoveCount(page)).toBe(0);
	});

	test('restart button works', async ({ page }) => {
		await pressDirection(page, 'right');
		await pressDirection(page, 'right');
		await page.getByTestId('restart-button').click();
		expect(await getMoveCount(page)).toBe(0);
	});
});
