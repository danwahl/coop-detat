import type { Direction, LevelDef, GameState } from '$lib/engine/types.js';
import { createGameState, cloneState } from '$lib/engine/state.js';
import { tick, canMove } from '$lib/engine/rules.js';

let current = $state<GameState>(null!);
let undoStack = $state<GameState[]>([]);

export function initGame(level: LevelDef) {
	current = createGameState(level);
	undoStack = [];
}

export function move(direction: Direction) {
	if (!canMove(current, direction)) return;
	const prev = cloneState(current);
	const next = tick(current, direction);
	if (!next) return;
	undoStack = [...undoStack, prev];
	current = next;
}

export function undo() {
	if (undoStack.length === 0) return;
	const prev = undoStack[undoStack.length - 1];
	undoStack = undoStack.slice(0, -1);
	current = prev;
}

export function restart() {
	current = createGameState(current.level);
	undoStack = [];
}

export function getState(): GameState {
	return current;
}

export function getUndoLength(): number {
	return undoStack.length;
}
