<script lang="ts">
	import type { LevelDef } from '$lib/engine/types.js';
	import { levels, secretLevel } from '$lib/levels/index.js';
	import GameView from '$lib/components/GameView.svelte';
	import EditorView from '$lib/components/EditorView.svelte';
	import { loadProgress, resetProgress } from '$lib/stores/progress.js';
	import chickenUrl from '$lib/assets/emoji/chicken.svg';

	let selectedLevel = $state<LevelDef | null>(null);
	let showEditor = $state(false);
	let progress = $state(loadProgress());

	function refreshProgress() {
		progress = loadProgress();
	}

	let allPerfect = $derived(levels.every(l => {
		const p = progress[l.id];
		return p?.solved && l.par && p.bestMoves <= l.par;
	}));

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
		<div class="menu-header">
			<h1>Coop D'etat</h1>
			<p class="subtitle">
				<img src={chickenUrl} alt="" class="subtitle-chicken left" />
				Rescue the chickens
				<img src={chickenUrl} alt="" class="subtitle-chicken right" />
			</p>
		</div>
		<div class="level-list">
			{#each levels as level}
				{@const prog = progress[level.id]}
				{@const atPar = prog?.solved && level.par && prog.bestMoves <= level.par}
				<button data-testid="level-button-{level.id}" onclick={() => (selectedLevel = level)}>
					<span class="level-info">
						<span class="status-dot" class:solved={prog?.solved && !atPar} class:perfect={atPar}></span>
						<span>{level.name}</span>
					</span>
					<span class="par">
						{#if prog?.bestMoves}Best: {prog.bestMoves} | {/if}Par: {level.par ?? '???'}
					</span>
				</button>
			{/each}
		</div>
		{#if allPerfect}
			{@const secretProg = progress[secretLevel.id]}
			<div class="secret-level">
				<button class="secret-btn" class:solved={secretProg?.solved} data-testid="secret-level-button" onclick={() => (selectedLevel = secretLevel)}>
					{secretProg?.solved ? '!!!' : '???'}
				</button>
			</div>
		{/if}
		<div class="menu-footer">
			<button class="editor-btn" data-testid="editor-button" onclick={() => (showEditor = true)}>Level Editor</button>
			{#if Object.keys(progress).length > 0}
				<button class="reset-btn" data-testid="reset-progress-button" onclick={() => { resetProgress(); refreshProgress(); }}>Reset Progress</button>
			{/if}
			<span class="version">v{__APP_VERSION__}</span>
		</div>
	</div>
{/if}

<style>
	:global(html, body) {
		margin: 0;
		background: #1a1a1a;
		color: white;
		font-family: monospace;
		overflow: hidden;
		height: 100vh;
		height: 100dvh;
	}
	.menu {
		height: 100vh;
		height: 100dvh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.menu-header {
		padding: 24px 16px 16px;
		text-align: center;
		flex-shrink: 0;
	}
	h1 { font-size: 2.5rem; margin-bottom: 8px; }
	.subtitle {
		color: #aaa;
		margin-bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}
	.subtitle-chicken {
		width: 1.2em;
		height: 1.2em;
		display: inline-block;
	}
	.subtitle-chicken.left { transform: rotate(-7deg); }
	.subtitle-chicken.right { transform: rotate(7deg); }
	.level-list {
		flex: 1;
		overflow-y: auto;
		padding: 0 16px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
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
		align-items: center;
		gap: 8px;
		width: 100%;
		max-width: 300px;
	}
	.level-list button:hover { background: #444; }
	.level-info { display: flex; align-items: center; gap: 8px; min-width: 0; }
	.level-info span:last-child { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.status-dot { width: 8px; height: 8px; border-radius: 50%; background: #555; flex-shrink: 0; }
	.status-dot.solved { background: #FFD700; }
	.status-dot.perfect { background: #4CAF50; }
	.par { color: #888; white-space: nowrap; flex-shrink: 0; font-size: 0.85rem; }
	.menu-footer {
		padding: 16px;
		text-align: center;
		flex-shrink: 0;
	}
	.editor-btn {
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
	.secret-level { text-align: center; padding: 8px 16px 0; flex-shrink: 0; }
	.secret-btn {
		padding: 8px 24px;
		font-size: 1rem;
		font-family: monospace;
		background: transparent;
		color: #555;
		border: 1px dashed #444;
		border-radius: 8px;
		cursor: pointer;
		letter-spacing: 4px;
	}
	.secret-btn:hover { color: #FFD700; border-color: #FFD700; }
	.secret-btn.solved { color: #FFD700; border-color: #FFD700; letter-spacing: normal; }
	.reset-btn {
		display: block;
		margin: 12px auto 0;
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
	.version { display: block; margin-top: 12px; font-size: 0.7rem; color: #555; }
</style>
