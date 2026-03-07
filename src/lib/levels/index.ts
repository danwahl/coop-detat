import type { LevelDef } from '$lib/engine/types.js';
import level1 from './level1.json';
import level2 from './level2.json';
import level3 from './level3.json';

export const levels: LevelDef[] = [
	level1 as LevelDef,
	level2 as LevelDef,
	level3 as LevelDef
];
