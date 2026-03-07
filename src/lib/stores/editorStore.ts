import type { CellType, LevelDef, Guard, Camera, Direction } from '$lib/engine/types.js';

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
let editingGuardMode = $state<'pace' | 'loop'>('pace');
let editingGuardVision = $state(3);
let editingCameraDir = $state<Direction[]>([]);
let editingCameraMode = $state<'fixed' | 'pace' | 'loop'>('fixed');
let editingCameraVision = $state(3);

export function initEditor(w: number = 10, h: number = 7) {
	width = w;
	height = h;
	grid = Array.from({ length: h }, () => Array.from({ length: w }, () => 'empty' as CellType));
	playerStart = { x: 1, y: 1 };
	exit = { x: w - 2, y: h - 2 };
	guards = [];
	cameras = [];
	levelName = 'Untitled';
	levelId = 'untitled';
	guardPathInProgress = [];
	editingCameraDir = [];
}

export function setTool(tool: EditorTool) {
	if (currentTool === 'guard' && tool !== 'guard') {
		finalizeGuard();
	}
	if (currentTool === 'camera' && tool !== 'camera') {
		finalizeCamera();
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
		guardPathInProgress = [...guardPathInProgress, { x, y }];
		return;
	}
	if (currentTool === 'camera') {
		// Place camera at clicked position, then set directions via palette
		editingCameraDir = ['right'];
		cameras = [...cameras, {
			id: `cam-${Date.now()}`,
			pos: { x, y },
			directions: ['right'],
			dirIndex: 0,
			dirDirection: 1 as 1 | -1,
			patrolMode: 'fixed',
			visionRange: editingCameraVision
		}];
		currentTool = 'empty';
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

function finalizeGuard() {
	if (guardPathInProgress.length >= 2) {
		guards = [...guards, {
			id: `guard-${Date.now()}`,
			path: [...guardPathInProgress],
			pathIndex: 0,
			pathDirection: 1 as 1 | -1,
			patrolMode: editingGuardMode,
			facing: 'right' as Direction,
			visionRange: editingGuardVision
		}];
	}
	guardPathInProgress = [];
}

function finalizeCamera() {
	editingCameraDir = [];
}

export function exportLevel(): LevelDef {
	return {
		id: levelId,
		name: levelName,
		width,
		height,
		grid: grid.map(row => [...row]),
		playerStart: { ...playerStart },
		guards: structuredClone(guards),
		cameras: structuredClone(cameras),
		exit: { ...exit }
	};
}

export function importLevel(level: LevelDef) {
	width = level.width;
	height = level.height;
	grid = level.grid.map(row => [...row]);
	playerStart = { ...level.playerStart };
	exit = { ...level.exit };
	guards = structuredClone(level.guards);
	cameras = structuredClone(level.cameras);
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
		editingGuardMode, editingGuardVision, editingCameraVision
	};
}

export function setLevelName(name: string) { levelName = name; }
export function setLevelId(id: string) { levelId = id; }
export function setGuardMode(mode: 'pace' | 'loop') { editingGuardMode = mode; }
export function setGuardVision(v: number) { editingGuardVision = v; }
export function setCameraVision(v: number) { editingCameraVision = v; }
export function finalizeGuardPath() { finalizeGuard(); }
