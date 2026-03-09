import { type Page, expect } from '@playwright/test';

type Direction = 'up' | 'down' | 'left' | 'right';

const KEY_MAP: Record<Direction, string> = {
	up: 'ArrowUp',
	down: 'ArrowDown',
	left: 'ArrowLeft',
	right: 'ArrowRight'
};

export async function openLevel(page: Page, levelId: string) {
	await page.goto('/');
	await page.getByTestId(`level-button-${levelId}`).click();
	await expect(page.getByTestId('game-container')).toBeVisible();
}

export async function pressDirection(page: Page, dir: Direction) {
	await page.keyboard.press(KEY_MAP[dir]);
}

export async function playSolution(page: Page, moves: Direction[]) {
	for (const dir of moves) {
		await pressDirection(page, dir);
	}
}

export async function getMoveCount(page: Page): Promise<number> {
	const text = await page.getByTestId('move-counter').textContent();
	return parseInt(text!.replace('Moves: ', ''), 10);
}

export async function expectStatus(page: Page, status: 'playing' | 'won' | 'lost') {
	if (status === 'playing') {
		await expect(page.getByTestId('status-overlay')).not.toBeVisible();
	} else if (status === 'won') {
		await expect(page.getByTestId('status-message')).toHaveText('Level Complete!');
	} else {
		await expect(page.getByTestId('status-message')).toHaveText('Caught!');
	}
}

export async function drainExit(page: Page, count: number) {
	for (let i = 0; i < count; i++) {
		await pressDirection(page, 'right');
	}
}

export async function swipe(page: Page, dir: Direction) {
	const box = await page.getByTestId('game-container').boundingBox();
	if (!box) throw new Error('game-container not found');
	const cx = box.x + box.width / 2;
	const cy = box.y + box.height / 2;
	const dist = 60;
	const offsets: Record<Direction, [number, number]> = {
		up: [0, -dist],
		down: [0, dist],
		left: [-dist, 0],
		right: [dist, 0]
	};
	const [dx, dy] = offsets[dir];

	await page.touchscreen.tap(cx, cy);
	// Playwright doesn't have swipe natively, so we dispatch touch events
	await page.evaluate(
		({ cx, cy, dx, dy }) => {
			const el = document.querySelector('[data-testid="game-container"]')!;
			const touch1 = new Touch({ identifier: 1, target: el, clientX: cx, clientY: cy });
			const touch2 = new Touch({ identifier: 1, target: el, clientX: cx + dx, clientY: cy + dy });
			el.dispatchEvent(new TouchEvent('touchstart', { touches: [touch1], changedTouches: [touch1], bubbles: true }));
			el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch2], bubbles: true }));
		},
		{ cx, cy, dx, dy }
	);
}

export async function openEditor(page: Page) {
	await page.goto('/');
	await page.getByTestId('editor-button').click();
	await expect(page.getByTestId('editor-container')).toBeVisible();
}

export async function selectTool(page: Page, tool: string) {
	await page.getByTestId(`tool-${tool}`).click({ force: true });
}

export async function clickCell(page: Page, x: number, y: number) {
	await page.getByTestId(`cell-${x}-${y}`).click({ force: true });
}
