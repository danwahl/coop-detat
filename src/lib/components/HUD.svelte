<script lang="ts">
	import chickenUrl from '$lib/assets/emoji/chicken.svg';

	interface Props {
		turnNumber: number;
		par?: number;
		status: 'playing' | 'exiting' | 'won' | 'lost';
		onUndo: () => void;
		onRestart: () => void;
		onBack: () => void;
		onNextLevel?: () => void;
		chickenCount?: number;
	}

	let { turnNumber, par, status, onUndo, onRestart, onBack, onNextLevel, chickenCount }: Props = $props();
</script>

<div class="hud" data-testid="hud">
	<div class="hud-left">
		<button data-testid="back-button" onclick={onBack}>Back</button>
	</div>
	<div class="hud-center">
		<span data-testid="move-counter">Moves: {turnNumber}</span>
		{#if par}
			<span class="par" data-testid="par-display">Par: {par}</span>
		{/if}
	</div>
	<div class="hud-right">
		<button data-testid="undo-button" onclick={onUndo}>Undo <kbd>Z</kbd></button>
		<button data-testid="restart-button" onclick={onRestart}>Restart <kbd>R</kbd></button>
	</div>
</div>

{#if status === 'won' || status === 'lost'}
	<div class="overlay" class:won={status === 'won'} class:lost={status === 'lost'} data-testid="status-overlay">
		<div class="overlay-content">
			<h2 data-testid="status-message">{status === 'won' ? 'Level Complete!' : 'Caught!'}</h2>
			{#if status === 'won'}
				{#if chickenCount}
					<p class="rescue-message">You rescued {chickenCount} chicken{chickenCount !== 1 ? 's' : ''}!</p>
					<p class="chicken-lineup">
						{#each Array(chickenCount) as _, i}
							<img src={chickenUrl} alt="chicken" style="display: inline-block; width: 1.5em; height: 1.5em; vertical-align: middle; transform: rotate({(i % 2 === 0) ? 7 : -7}deg);" />
						{/each}
					</p>
				{/if}
				<p>Moves: {turnNumber}{par ? ` (Par: ${par})` : ''}</p>
			{/if}
			<button data-testid="overlay-restart-button" onclick={onRestart}>Restart <kbd>R</kbd></button>
			{#if status === 'won' && onNextLevel}
				<button data-testid="next-level-button" onclick={onNextLevel}>Next Level <kbd>N</kbd></button>
			{/if}
			<button data-testid="overlay-back-button" onclick={onBack}>Back <kbd>B</kbd></button>
		</div>
	</div>
{/if}

<style>
	.hud {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 16px;
		background: #333;
		color: white;
		font-family: monospace;
	}
	.hud-center {
		display: flex;
		gap: 16px;
	}
	.hud-right {
		display: flex;
		gap: 8px;
	}
	.par { color: #aaa; }
	button {
		padding: 4px 12px;
		cursor: pointer;
		border: 1px solid #666;
		background: #555;
		color: white;
		border-radius: 4px;
	}
	button:hover { background: #777; }
	kbd { font-size: 0.7em; padding: 1px 4px; background: rgba(255,255,255,0.15); border-radius: 3px; margin-left: 4px; font-family: monospace; }
	.overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}
	.overlay.won { background: rgba(76, 175, 80, 0.6); backdrop-filter: blur(2px); }
	.overlay.lost { background: rgba(244, 67, 54, 0.6); backdrop-filter: blur(2px); }
	.overlay-content {
		text-align: center;
		color: white;
		font-family: monospace;
	}
	.overlay-content h2 { font-size: 2rem; margin-bottom: 8px; }
	.rescue-message { font-size: 1.2rem; color: #fff8e1; margin-bottom: 4px; }
	.chicken-lineup { font-size: 1.5rem; letter-spacing: 2px; margin-bottom: 8px; }
	.overlay-content button { margin: 4px; font-size: 1rem; padding: 8px 16px; }
</style>
