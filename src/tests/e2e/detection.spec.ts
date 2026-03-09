import { test, expect } from '@playwright/test';
import { openLevel, pressDirection, expectStatus, playSolution, drainExit } from './helpers.js';

test.describe('Detection & Enemies', () => {
	test('camera vision cone renders on Level 2', async ({ page }) => {
		await openLevel(page, 'level2');
		// Camera at (6,1) facing left, range 4 -> vision cells at (5,1),(4,1),(3,1),(2,1)
		await expect(page.getByTestId('vision-5-1')).toBeVisible();
		await expect(page.getByTestId('vision-2-1')).toBeVisible();
	});

	test('walking into camera view triggers loss', async ({ page }) => {
		await openLevel(page, 'level2');
		// Move right into row 1 where camera sees
		await pressDirection(page, 'right'); // (2,1) — in camera vision
		await expectStatus(page, 'lost');
	});

	test('restart after detection', async ({ page }) => {
		await openLevel(page, 'level2');
		await pressDirection(page, 'right');
		await expectStatus(page, 'lost');
		await page.getByTestId('overlay-restart-button').click();
		await expectStatus(page, 'playing');
	});

	test('guard moves each turn on Level 3', async ({ page }) => {
		await openLevel(page, 'level3');
		const guard = page.getByTestId('guard-guard1');
		const pos1 = `${await guard.getAttribute('x')},${await guard.getAttribute('y')}`;
		await pressDirection(page, 'down'); // valid move, guard ticks
		const pos2 = `${await guard.getAttribute('x')},${await guard.getAttribute('y')}`;
		expect(pos1).not.toBe(pos2);
	});

	test('can beat Level 2', async ({ page }) => {
		await openLevel(page, 'level2');
		await playSolution(page, ['down', 'down', 'right', 'right', 'right', 'right', 'right']);
		await drainExit(page, 2); // 1 chicken + ninja
		await expectStatus(page, 'won');
	});
});
