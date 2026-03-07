import { test, expect, devices } from '@playwright/test';
import { openLevel, swipe, getMoveCount } from './helpers.js';

// Only run mobile tests on the mobile project
test.use({ ...devices['Pixel 5'] });

test.describe('Mobile / Touch', () => {
	test('menu renders at mobile width', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByText('Coop D\'etat')).toBeVisible();
		await expect(page.getByTestId('level-button-level1')).toBeVisible();
		await expect(page.getByTestId('editor-button')).toBeVisible();
	});

	test('grid fits mobile viewport', async ({ page }) => {
		await openLevel(page, 'level1');
		const grid = page.getByTestId('game-grid');
		await expect(grid).toBeVisible();
		const box = await grid.boundingBox();
		const viewport = page.viewportSize();
		if (box && viewport) {
			expect(box.width).toBeLessThanOrEqual(viewport.width);
			expect(box.height).toBeLessThanOrEqual(viewport.height);
		}
	});

	test('swipe moves player', async ({ page }) => {
		await openLevel(page, 'level1');
		await swipe(page, 'right');
		expect(await getMoveCount(page)).toBe(1);
	});

	test('swipe in all 4 directions', async ({ page }) => {
		await openLevel(page, 'level1');
		// right is valid from (1,2)
		await swipe(page, 'right');
		expect(await getMoveCount(page)).toBe(1);
		// down from (2,2) is valid
		await swipe(page, 'down');
		expect(await getMoveCount(page)).toBe(2);
		// left from (2,3) is valid
		await swipe(page, 'left');
		expect(await getMoveCount(page)).toBe(3);
		// up from (1,3) is valid
		await swipe(page, 'up');
		expect(await getMoveCount(page)).toBe(4);
	});
});
