import type { CellType, LevelDef, Guard, Camera, Direction } from '$lib/engine/types.js';
import { expandPath } from '$lib/engine/path.js';

export type EditorTool = 'empty' | 'wall' | 'cage' | 'exit' | 'playerStart' | 'guard' | 'camera' | 'eraser';

let width = $state(10);
let height = $state(7);
let grid = $state<CellType[][]>([]);
let playerStart = $state({ x: 1, y: 1 });
let exit = $state({ x: 8, y: 5 });
let guards = $state<Guard[]>([]);
let cameras = $state<Camera[]>([]);
let levelName = $state('Untitled');
let levelId = $state('untitled');
let currentTool = $state<EditorTool>('wall');
let guardPathInProgress = $state<{ x: number; y: number }[]>([]);
let editingGuardVision = $state(3);
let editingCameraDirection = $state<Direction>('right');
let editingCameraVision = $state(3);

export function initEditor(w: number = 10, h: number = 7) {
	width = w;
	height = h;
	grid = Array.from({ length: h }, () => Array.from({ length: w }, () => 'empty' as CellType));
	playerStart = { x: 1, y: 1 };
	exit = { x: w - 2, y: h - 2 };
	guards = [];
	cameras = [];
	levelName = '';
	levelId = '';
	guardPathInProgress = [];
	editingCameraDirection = 'right';
}

export function setTool(tool: EditorTool) {
	if (currentTool === 'guard' && tool !== 'guard') {
		finalizeGuard();
	}
	currentTool = tool;
}

export function clickCell(x: number, y: number) {
	if (currentTool === 'playerStart') {
		playerStart = { x, y };
		if (grid[y][x] !== 'empty') grid[y][x] = 'empty';
		return;
	}
	if (currentTool === 'exit') {
		exit = { x, y };
		if (grid[y][x] !== 'empty') grid[y][x] = 'empty';
		return;
	}
	if (currentTool === 'guard') {
		if (grid[y][x] !== 'empty') return;
		if (x === exit.x && y === exit.y) return;
		if (cameras.some(c => c.pos.x === x && c.pos.y === y)) return;

		// Click start cell to close loop
		if (guardPathInProgress.length >= 2) {
			const start = guardPathInProgress[0];
			if (x === start.x && y === start.y) {
				guards = [...guards, {
					id: `guard-${Date.now()}`,
					path: [...guardPathInProgress],
					pathIndex: 0,
					pathDirection: 1 as 1 | -1,
					patrolMode: 'loop',
					facing: 'right' as Direction,
					visionRange: editingGuardVision
				}];
				guardPathInProgress = [];
				return;
			}
		}

		guardPathInProgress = [...guardPathInProgress, { x, y }];
		return;
	}
	if (currentTool === 'camera') {
		if (grid[y][x] !== 'empty') return;
		if (x === playerStart.x && y === playerStart.y) return;
		if (x === exit.x && y === exit.y) return;
		if (cameras.some(c => c.pos.x === x && c.pos.y === y)) return;
		if (guards.some(g => g.path[0].x === x && g.path[0].y === y)) return;
		cameras = [...cameras, {
			id: `cam-${Date.now()}`,
			pos: { x, y },
			directions: [editingCameraDirection],
			dirIndex: 0,
			dirDirection: 1 as 1 | -1,
			patrolMode: 'fixed',
			visionRange: editingCameraVision
		}];
		return;
	}
	if (currentTool === 'eraser') {
		grid[y][x] = 'empty';
		guards = guards.filter(g => !g.path.some(p => p.x === x && p.y === y));
		cameras = cameras.filter(c => c.pos.x !== x || c.pos.y !== y);
		return;
	}
	grid[y][x] = currentTool as CellType;
}

function finalizeGuard(): string | null {
	if (guardPathInProgress.length === 1) {
		guardPathInProgress = [];
		return 'Guards need at least 2 path points (use Camera for stationary)';
	}
	if (guardPathInProgress.length >= 2) {
		guards = [...guards, {
			id: `guard-${Date.now()}`,
			path: [...guardPathInProgress],
			pathIndex: 0,
			pathDirection: 1 as 1 | -1,
			patrolMode: 'pace',
			facing: 'right' as Direction,
			visionRange: editingGuardVision
		}];
	}
	guardPathInProgress = [];
	return null;
}

export function exportLevel(): LevelDef {
	return {
		id: levelId || `level-${Date.now()}`,
		name: levelName || 'Untitled',
		width,
		height,
		grid: grid.map(row => [...row]),
		playerStart: { ...playerStart },
		guards: JSON.parse(JSON.stringify(guards)),
		cameras: JSON.parse(JSON.stringify(cameras)),
		exit: { ...exit }
	};
}

export function importLevel(level: LevelDef) {
	width = level.width;
	height = level.height;
	grid = level.grid.map(row => [...row]);
	playerStart = { ...level.playerStart };
	exit = { ...level.exit };
	guards = JSON.parse(JSON.stringify(level.guards));
	cameras = JSON.parse(JSON.stringify(level.cameras));
	levelName = level.name;
	levelId = level.id;
}

export function validate(): string[] {
	const errors: string[] = [];
	if (playerStart.x < 0 || playerStart.x >= width || playerStart.y < 0 || playerStart.y >= height)
		errors.push('Player start is out of bounds');
	if (exit.x < 0 || exit.x >= width || exit.y < 0 || exit.y >= height)
		errors.push('Exit is out of bounds');
	let cageCount = 0;
	for (const row of grid) for (const cell of row) if (cell === 'cage') cageCount++;
	if (cageCount === 0) errors.push('Level must have at least one cage');
	if (grid[playerStart.y]?.[playerStart.x] !== 'empty')
		errors.push('Player start must be on an empty cell');
	if (grid[exit.y]?.[exit.x] !== 'empty')
		errors.push('Exit must be on an empty cell');
	for (const guard of guards) {
		if (guard.patrolMode === 'loop' && guard.path.length >= 2) {
			const last = guard.path[guard.path.length - 1];
			const first = guard.path[0];
			if (last.x !== first.x && last.y !== first.y) {
				errors.push(`Loop guard "${guard.id}" last waypoint doesn't connect back to first (must be axis-aligned)`);
			}
		}
		try {
			const expanded = expandPath(guard.path, guard.patrolMode === 'loop');
			for (const pos of expanded) {
				if (pos.x < 0 || pos.x >= width || pos.y < 0 || pos.y >= height) {
					errors.push(`Guard "${guard.id}" path goes out of bounds at (${pos.x},${pos.y})`);
					break;
				} else if (grid[pos.y][pos.x] === 'wall' || grid[pos.y][pos.x] === 'cage') {
					errors.push(`Guard "${guard.id}" path goes through ${grid[pos.y][pos.x]} at (${pos.x},${pos.y})`);
					break;
				}
			}
		} catch (e) {
			errors.push(`Guard "${guard.id}" has invalid path: ${(e as Error).message}`);
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

export function resizeGrid(w: number, h: number) {
	const newGrid = Array.from({ length: h }, (_, y) =>
		Array.from({ length: w }, (_, x) => (y < height && x < width ? grid[y][x] : 'empty') as CellType)
	);
	width = w;
	height = h;
	grid = newGrid;
}

export function getEditorState() {
	return {
		width, height, grid, playerStart, exit, guards, cameras,
		levelName, levelId, currentTool, guardPathInProgress,
		editingGuardVision,
		editingCameraDirection, editingCameraVision
	};
}

export function setLevelName(name: string) { levelName = name; }
export function setLevelId(id: string) { levelId = id; }
export function setGuardVision(v: number) { editingGuardVision = v; }
export function setCameraVision(v: number) { editingCameraVision = v; }
export function setCameraDirection(dir: Direction) { editingCameraDirection = dir; }
export function finalizeGuardPath(): string | null { return finalizeGuard(); }

const PAINTABLE_TOOLS: Set<EditorTool> = new Set(['wall', 'cage', 'empty', 'eraser']);

export function isPaintable(): boolean {
	return PAINTABLE_TOOLS.has(currentTool);
}

export function paintCell(x: number, y: number) {
	if (!PAINTABLE_TOOLS.has(currentTool)) return;
	if (currentTool === 'eraser') {
		grid[y][x] = 'empty';
	} else {
		grid[y][x] = currentTool as CellType;
	}
}
