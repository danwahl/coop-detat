export type Direction = 'up' | 'down' | 'left' | 'right';
export type Position = { x: number; y: number };

export type CellType = 'empty' | 'wall' | 'cage' | 'exit';

export type Guard = {
	id: string;
	path: Position[];
	pathIndex: number;
	pathDirection: 1 | -1;
	patrolMode: 'pace' | 'loop';
	facing: Direction;
	visionRange: number;
};

export type Camera = {
	id: string;
	pos: Position;
	directions: Direction[];
	dirIndex: number;
	dirDirection: 1 | -1;
	patrolMode: 'fixed' | 'pace' | 'loop';
	visionRange: number;
};

export type LevelDef = {
	id: string;
	name: string;
	width: number;
	height: number;
	grid: CellType[][];
	playerStart: Position;
	guards: Guard[];
	cameras: Camera[];
	exit: Position;
	par?: number;
};

export type GameState = {
	level: LevelDef;
	playerPos: Position;
	snake: Position[];
	guards: Guard[];
	cameras: Camera[];
	collectedCages: Position[];
	pendingChicken: boolean;
	turnNumber: number;
	status: 'playing' | 'won' | 'lost';
};

export type GameStore = {
	current: GameState;
	undoStack: GameState[];
};
