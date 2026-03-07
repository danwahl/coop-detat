import { test, expect } from '@playwright/test';

test.describe('Navigation & Menu', () => {
	test('menu renders with all levels', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByText('Coop D\'etat')).toBeVisible();
		await expect(page.getByTestId('level-button-level1')).toBeVisible();
		await expect(page.getByTestId('level-button-level2')).toBeVisible();
		await expect(page.getByTestId('level-button-level3')).toBeVisible();
		await expect(page.getByTestId('editor-button')).toBeVisible();
	});

	test('clicking a level opens GameView', async ({ page }) => {
		await page.goto('/');
		await page.getByTestId('level-button-level1').click();
		await expect(page.getByTestId('game-container')).toBeVisible();
		await expect(page.getByTestId('move-counter')).toHaveText('Moves: 0');
		await expect(page.getByTestId('back-button')).toBeVisible();
	});

	test('back button returns to menu', async ({ page }) => {
		await page.goto('/');
		await page.getByTestId('level-button-level1').click();
		await page.getByTestId('back-button').click();
		await expect(page.getByTestId('menu')).toBeVisible();
	});

	test('level re-selection works', async ({ page }) => {
		await page.goto('/');
		await page.getByTestId('level-button-level1').click();
		await expect(page.getByTestId('game-grid')).toBeVisible();
		await page.getByTestId('back-button').click();
		await page.getByTestId('level-button-level2').click();
		await expect(page.getByTestId('game-container')).toBeVisible();
		// Level 2 has a camera
		await expect(page.getByTestId('camera-cam1')).toBeVisible();
	});

	test('editor button opens EditorView', async ({ page }) => {
		await page.goto('/');
		await page.getByTestId('editor-button').click();
		await expect(page.getByTestId('editor-container')).toBeVisible();
	});

	test('editor back returns to menu', async ({ page }) => {
		await page.goto('/');
		await page.getByTestId('editor-button').click();
		await page.getByTestId('editor-back-button').click();
		await expect(page.getByTestId('menu')).toBeVisible();
	});
});
