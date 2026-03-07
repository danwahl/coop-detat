<script lang="ts">
	interface Props {
		turnNumber: number;
		par?: number;
		status: 'playing' | 'won' | 'lost';
		onUndo: () => void;
		onRestart: () => void;
		onBack: () => void;
	}

	let { turnNumber, par, status, onUndo, onRestart, onBack }: Props = $props();
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
		<button data-testid="undo-button" onclick={onUndo}>Undo</button>
		<button data-testid="restart-button" onclick={onRestart}>Restart</button>
	</div>
</div>

{#if status !== 'playing'}
	<div class="overlay" class:won={status === 'won'} class:lost={status === 'lost'} data-testid="status-overlay">
		<div class="overlay-content">
			<h2 data-testid="status-message">{status === 'won' ? 'Level Complete!' : 'Detected!'}</h2>
			{#if status === 'won'}
				<p>Moves: {turnNumber}{par ? ` (Par: ${par})` : ''}</p>
			{/if}
			<button data-testid="overlay-restart-button" onclick={onRestart}>Restart</button>
			<button data-testid="overlay-back-button" onclick={onBack}>Back</button>
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
	.overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}
	.overlay.won { background: rgba(76, 175, 80, 0.85); }
	.overlay.lost { background: rgba(244, 67, 54, 0.85); }
	.overlay-content {
		text-align: center;
		color: white;
		font-family: monospace;
	}
	.overlay-content h2 { font-size: 2rem; margin-bottom: 8px; }
	.overlay-content button { margin: 4px; font-size: 1rem; padding: 8px 16px; }
</style>
