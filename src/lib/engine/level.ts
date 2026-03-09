import type { LevelDef } from './types.js';
import { expandPath } from './path.js';

export function validateLevel(level: LevelDef): string[] {
	const errors: string[] = [];
	const { width, height, grid, playerStart, exit, guards, cameras } = level;

	if (playerStart.x < 0 || playerStart.x >= width || playerStart.y < 0 || playerStart.y >= height)
		errors.push('Player start is out of bounds');
	else if (grid[playerStart.y][playerStart.x] !== 'empty')
		errors.push('Player start must be on an empty cell');

	if (exit.x < 0 || exit.x >= width || exit.y < 0 || exit.y >= height)
		errors.push('Exit is out of bounds');
	else if (grid[exit.y][exit.x] !== 'empty')
		errors.push('Exit must be on an empty cell');

	let cageCount = 0;
	for (const row of grid) for (const cell of row) if (cell === 'cage') cageCount++;
	if (cageCount === 0) errors.push('Level must have at least one cage');

	for (const guard of guards) {
		if (guard.patrolMode === 'loop' && guard.path.length >= 2) {
			const last = guard.path[guard.path.length - 1];
			const first = guard.path[0];
			if (last.x !== first.x && last.y !== first.y) {
				errors.push(`Loop guard "${guard.id}" can't close loop (not axis-aligned)`);
			}
		}
		try {
			const expanded = expandPath(guard.path, guard.patrolMode === 'loop');
			for (const pos of expanded) {
				if (pos.x < 0 || pos.x >= width || pos.y < 0 || pos.y >= height) {
					errors.push(`Guard "${guard.id}" path out of bounds at (${pos.x},${pos.y})`);
					break;
				} else if (grid[pos.y][pos.x] === 'wall' || grid[pos.y][pos.x] === 'cage') {
					errors.push(`Guard "${guard.id}" path through ${grid[pos.y][pos.x]} at (${pos.x},${pos.y})`);
					break;
				}
			}
		} catch (e) {
			errors.push(`Guard "${guard.id}" invalid path: ${(e as Error).message}`);
		}
	}

	const DIR_DX: Record<string, number> = { up: 0, down: 0, left: -1, right: 1 };
	const DIR_DY: Record<string, number> = { up: -1, down: 1, left: 0, right: 0 };
	for (const camera of cameras) {
		const dir = camera.directions[0];
		const nx = camera.pos.x + DIR_DX[dir];
		const ny = camera.pos.y + DIR_DY[dir];
		if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
			const cell = grid[ny][nx];
			if (cell === 'wall' || cell === 'cage') {
				errors.push(`Camera "${camera.id}" faces ${dir} into ${cell} at (${nx},${ny})`);
			}
		}
	}

	return errors;
}
