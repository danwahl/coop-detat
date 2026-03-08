<script lang="ts">
	import type { LevelDef } from '$lib/engine/types.js';
	import { levels } from '$lib/levels/index.js';
	import GameView from '$lib/components/GameView.svelte';
	import EditorView from '$lib/components/EditorView.svelte';
	import { loadProgress, resetProgress } from '$lib/stores/progress.js';

	let selectedLevel = $state<LevelDef | null>(null);
	let showEditor = $state(false);
	let progress = $state(loadProgress());

	function refreshProgress() {
		progress = loadProgress();
	}

	let nextLevel = $derived.by(() => {
		if (!selectedLevel) return null;
		const idx = levels.findIndex(l => l.id === selectedLevel!.id);
		return idx >= 0 && idx < levels.length - 1 ? levels[idx + 1] : null;
	});
</script>

{#if showEditor}
	<EditorView onBack={() => (showEditor = false)} />
{:else if selectedLevel}
	<GameView level={selectedLevel} onBack={() => { selectedLevel = null; refreshProgress(); }} onNextLevel={nextLevel ? () => { selectedLevel = nextLevel; refreshProgress(); } : undefined} />
{:else}
	<div class="menu" data-testid="menu">
		<h1>Coop D'etat</h1>
		<p>Rescue the chickens.</p>
		<div class="level-list">
			{#each levels as level}
				{@const prog = progress[level.id]}
				{@const atPar = prog?.solved && level.par && prog.bestMoves <= level.par}
				<button data-testid="level-button-{level.id}" onclick={() => (selectedLevel = level)}>
					<span class="level-info">
						<span class="status-dot" class:solved={prog?.solved} class:gold={atPar}></span>
						<span>{level.name}</span>
					</span>
					<span class="par">
						{#if prog?.bestMoves}Best: {prog.bestMoves}{/if}
						{#if level.par}{prog?.bestMoves ? ' | ' : ''}Par: {level.par}{/if}
					</span>
				</button>
			{/each}
		</div>
		<button class="editor-btn" data-testid="editor-button" onclick={() => (showEditor = true)}>Level Editor</button>
		{#if Object.keys(progress).length > 0}
			<button class="reset-btn" data-testid="reset-progress-button" onclick={() => { resetProgress(); refreshProgress(); }}>Reset Progress</button>
		{/if}
	</div>
{/if}

<style>
	:global(body) {
		margin: 0;
		background: #1a1a1a;
		color: white;
		font-family: monospace;
	}
	.menu {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 48px 16px;
	}
	h1 { font-size: 2.5rem; margin-bottom: 8px; }
	p { color: #aaa; margin-bottom: 32px; }
	.level-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
		max-width: 300px;
	}
	.level-list button {
		padding: 12px 16px;
		font-size: 1rem;
		font-family: monospace;
		background: #333;
		color: white;
		border: 1px solid #555;
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
	}
	.level-list button:hover { background: #444; }
	.level-info { display: flex; align-items: center; gap: 8px; }
	.status-dot { width: 8px; height: 8px; border-radius: 50%; background: #555; flex-shrink: 0; }
	.status-dot.solved { background: #4CAF50; }
	.status-dot.gold { background: #FFD700; }
	.par { color: #888; }
	.editor-btn {
		margin-top: 32px;
		padding: 12px 24px;
		font-size: 1rem;
		font-family: monospace;
		background: #555;
		color: white;
		border: 1px solid #777;
		border-radius: 8px;
		cursor: pointer;
	}
	.editor-btn:hover { background: #666; }
	.reset-btn {
		margin-top: 16px;
		padding: 8px 16px;
		font-size: 0.85rem;
		font-family: monospace;
		background: #444;
		color: #aaa;
		border: 1px solid #666;
		border-radius: 8px;
		cursor: pointer;
	}
	.reset-btn:hover { background: #555; color: white; }
</style>
