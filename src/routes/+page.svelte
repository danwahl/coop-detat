<script lang="ts">
	import type { LevelDef } from '$lib/engine/types.js';
	import { levels } from '$lib/levels/index.js';
	import GameView from '$lib/components/GameView.svelte';
	import EditorView from '$lib/components/EditorView.svelte';

	let selectedLevel = $state<LevelDef | null>(null);
	let showEditor = $state(false);
</script>

{#if showEditor}
	<EditorView onBack={() => (showEditor = false)} />
{:else if selectedLevel}
	<GameView level={selectedLevel} onBack={() => (selectedLevel = null)} />
{:else}
	<div class="menu">
		<h1>Coop D'etat</h1>
		<p>Rescue the chickens.</p>
		<div class="level-list">
			{#each levels as level}
				<button onclick={() => (selectedLevel = level)}>
					{level.name}
					{#if level.par}<span class="par">Par: {level.par}</span>{/if}
				</button>
			{/each}
		</div>
		<button class="editor-btn" onclick={() => (showEditor = true)}>Level Editor</button>
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
</style>
