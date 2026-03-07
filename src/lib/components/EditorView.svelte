<script lang="ts">
	import {
		initEditor, clickCell, setTool, exportLevel, importLevel,
		validate, resizeGrid, getEditorState, setLevelName, setLevelId,
		setGuardMode, setGuardVision, finalizeGuardPath
	} from '$lib/stores/editorStore.js';
	import { createGameState } from '$lib/engine/state.js';
	import { solve } from '$lib/engine/solver.js';
	import type { LevelDef } from '$lib/engine/types.js';
	import Grid from './Grid.svelte';
	import GameView from './GameView.svelte';

	interface Props {
		onBack: () => void;
	}

	let { onBack }: Props = $props();

	initEditor();

	let editorState = $derived(getEditorState());
	let testPlayLevel = $state<LevelDef | null>(null);
	let solveResult = $state<string>('');
	let validationErrors = $state<string[]>([]);

	let previewState = $derived.by(() => {
		const level = exportLevel();
		return createGameState(level);
	});

	function handleExport() {
		const level = exportLevel();
		const json = JSON.stringify(level, null, '\t');
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${level.id}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function handleImport() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;
			const text = await file.text();
			const level = JSON.parse(text) as LevelDef;
			importLevel(level);
		};
		input.click();
	}

	function handleValidate() {
		validationErrors = validate();
	}

	function handleSolve() {
		const errors = validate();
		if (errors.length > 0) {
			solveResult = 'Fix validation errors first';
			return;
		}
		const level = exportLevel();
		const result = solve(level, 100);
		if (result) {
			solveResult = `Solvable in ${result.solution.length} moves (explored ${result.explored} states)`;
		} else {
			solveResult = 'Unsolvable (or > 100 moves)';
		}
	}

	function handleTestPlay() {
		const errors = validate();
		if (errors.length > 0) {
			validationErrors = errors;
			return;
		}
		testPlayLevel = exportLevel();
	}

	type EditorTool = 'empty' | 'wall' | 'cage' | 'exit' | 'playerStart' | 'guard' | 'camera' | 'eraser';

	const tools: { tool: EditorTool; label: string }[] = [
		{ tool: 'empty', label: 'Empty' },
		{ tool: 'wall', label: 'Wall' },
		{ tool: 'cage', label: 'Cage' },
		{ tool: 'exit', label: 'Exit' },
		{ tool: 'playerStart', label: 'Player' },
		{ tool: 'guard', label: 'Guard' },
		{ tool: 'camera', label: 'Camera' },
		{ tool: 'eraser', label: 'Eraser' }
	];
</script>

{#if testPlayLevel}
	<GameView level={testPlayLevel} onBack={() => (testPlayLevel = null)} />
{:else}
	<div class="editor">
		<div class="toolbar">
			<button onclick={onBack}>Back</button>
			<input type="text" value={editorState.levelName} oninput={(e) => setLevelName(e.currentTarget.value)} placeholder="Level name" />
			<input type="text" value={editorState.levelId} oninput={(e) => setLevelId(e.currentTarget.value)} placeholder="Level ID" />
			<label>W: <input type="number" value={editorState.width} min="3" max="33" oninput={(e) => resizeGrid(+e.currentTarget.value, editorState.height)} /></label>
			<label>H: <input type="number" value={editorState.height} min="3" max="18" oninput={(e) => resizeGrid(editorState.width, +e.currentTarget.value)} /></label>
			<button onclick={handleExport}>Export</button>
			<button onclick={handleImport}>Import</button>
			<button onclick={handleValidate}>Validate</button>
			<button onclick={handleSolve}>Solve</button>
			<button onclick={handleTestPlay}>Test Play</button>
		</div>

		<div class="palette">
			{#each tools as { tool, label }}
				<button
					class:active={editorState.currentTool === tool}
					onclick={() => setTool(tool)}
				>{label}</button>
			{/each}
		</div>

		{#if editorState.currentTool === 'guard'}
			<div class="entity-config">
				<label>Mode:
					<select value={editorState.editingGuardMode} onchange={(e) => setGuardMode(e.currentTarget.value as 'pace' | 'loop')}>
						<option value="pace">Pace</option>
						<option value="loop">Loop</option>
					</select>
				</label>
				<label>Vision: <input type="number" value={editorState.editingGuardVision} min="1" max="10" oninput={(e) => setGuardVision(+e.currentTarget.value)} /></label>
				<span>Path: {editorState.guardPathInProgress.length} points</span>
				<button onclick={finalizeGuardPath}>Finish Guard</button>
			</div>
		{/if}

		{#if validationErrors.length > 0}
			<div class="errors">
				{#each validationErrors as err}<p>{err}</p>{/each}
			</div>
		{/if}

		{#if solveResult}
			<div class="solve-result">{solveResult}</div>
		{/if}

		<div class="grid-area">
			<Grid state={previewState} showVision={false} onCellClick={clickCell} />
		</div>
	</div>
{/if}

<style>
	.editor { display: flex; flex-direction: column; height: 100vh; background: #1a1a1a; color: white; font-family: monospace; }
	.toolbar { display: flex; gap: 8px; padding: 8px; background: #333; flex-wrap: wrap; align-items: center; }
	.toolbar input { width: 80px; padding: 4px; font-family: monospace; }
	.toolbar input[type="text"] { width: 120px; }
	.palette { display: flex; gap: 4px; padding: 8px; background: #2a2a2a; }
	.palette button { padding: 6px 12px; background: #444; color: white; border: 1px solid #666; border-radius: 4px; cursor: pointer; font-family: monospace; }
	.palette button.active { background: #0078d4; border-color: #0078d4; }
	.entity-config { padding: 8px; background: #2a2a2a; display: flex; gap: 12px; align-items: center; }
	.entity-config label { display: flex; gap: 4px; align-items: center; }
	.entity-config input, .entity-config select { width: 60px; padding: 2px; font-family: monospace; }
	.errors { padding: 8px; background: #5a1a1a; }
	.errors p { margin: 2px 0; color: #ff8888; }
	.solve-result { padding: 8px; background: #1a3a1a; color: #88ff88; }
	.grid-area { flex: 1; display: flex; align-items: center; justify-content: center; padding: 16px; overflow: hidden; }
	button { padding: 4px 12px; cursor: pointer; border: 1px solid #666; background: #555; color: white; border-radius: 4px; font-family: monospace; }
	button:hover { background: #777; }
</style>
