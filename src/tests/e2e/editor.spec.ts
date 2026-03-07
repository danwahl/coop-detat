import { test, expect } from '@playwright/test';
import { openEditor, selectTool, clickCell } from './helpers.js';

test.describe('Level Editor', () => {
	test.beforeEach(async ({ page }) => {
		await openEditor(page);
	});

	test('editor initializes with default grid', async ({ page }) => {
		await expect(page.getByTestId('game-grid')).toBeVisible();
		await expect(page.getByTestId('player-head')).toBeVisible();
		await expect(page.getByTestId('exit-marker')).toBeVisible();
	});

	test('wall tool paints walls', async ({ page }) => {
		await selectTool(page, 'wall');
		await clickCell(page, 3, 3);
		// Verify cell fill changed to wall color
		const fill = await page.getByTestId('cell-3-3').getAttribute('fill');
		expect(fill).toBe('#4a4a4a');
	});

	test('cage tool places cage', async ({ page }) => {
		await selectTool(page, 'cage');
		await clickCell(page, 4, 3);
		const fill = await page.getByTestId('cell-4-3').getAttribute('fill');
		expect(fill).toBe('#8B6914');
	});

	test('eraser tool removes content', async ({ page }) => {
		await selectTool(page, 'wall');
		await clickCell(page, 3, 3);
		await selectTool(page, 'eraser');
		await clickCell(page, 3, 3);
		const fill = await page.getByTestId('cell-3-3').getAttribute('fill');
		expect(fill).toBe('#e8e0d4');
	});

	test('validation catches missing cages', async ({ page }) => {
		await page.getByTestId('validate-button').click();
		await expect(page.getByTestId('validation-errors')).toContainText('at least one cage');
	});

	test('validation passes for valid level', async ({ page }) => {
		await selectTool(page, 'cage');
		await clickCell(page, 4, 3);
		await page.getByTestId('validate-button').click();
		// No errors should appear (or previous errors should be gone)
		await expect(page.getByTestId('validation-errors')).not.toBeVisible();
	});

	test('solve finds solution', async ({ page }) => {
		await selectTool(page, 'cage');
		await clickCell(page, 4, 3);
		await page.getByTestId('solve-button').click();
		await expect(page.getByTestId('solve-result')).toContainText('Solvable in');
	});

	test('test play launches game', async ({ page }) => {
		await selectTool(page, 'cage');
		await clickCell(page, 4, 3);
		await page.getByTestId('test-play-button').click();
		await expect(page.getByTestId('game-container')).toBeVisible();
	});

	test('test play back returns to editor', async ({ page }) => {
		await selectTool(page, 'cage');
		await clickCell(page, 4, 3);
		await page.getByTestId('test-play-button').click();
		await page.getByTestId('back-button').click();
		await expect(page.getByTestId('editor-container')).toBeVisible();
	});

	test('grid resize works', async ({ page }) => {
		await page.getByTestId('width-input').fill('12');
		// Cell at (11, 3) should now exist
		await expect(page.getByTestId('cell-11-3')).toBeVisible();
	});

	test('export downloads JSON', async ({ page }) => {
		await selectTool(page, 'cage');
		await clickCell(page, 4, 3);
		const downloadPromise = page.waitForEvent('download');
		await page.getByTestId('export-button').click();
		const download = await downloadPromise;
		expect(download.suggestedFilename()).toContain('.json');
	});
});
