type LevelProgress = { solved: boolean; bestMoves: number };
type Progress = Record<string, LevelProgress>;

const STORAGE_KEY = 'coop-detat-progress';

export function loadProgress(): Progress {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

export function saveProgress(levelId: string, moves: number): void {
	const progress = loadProgress();
	const existing = progress[levelId];
	if (!existing || moves < existing.bestMoves) {
		progress[levelId] = { solved: true, bestMoves: moves };
	} else if (!existing.solved) {
		progress[levelId] = { solved: true, bestMoves: moves };
	}
	localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function resetProgress(): void {
	localStorage.removeItem(STORAGE_KEY);
}
