<script lang="ts">
	import type { Direction, LevelDef } from '$lib/engine/types.js';
	import { initGame, move, undo, restart, getState } from '$lib/stores/gameStore.svelte.js';
	import { saveProgress } from '$lib/stores/progress.js';
	import Grid from './Grid.svelte';
	import HUD from './HUD.svelte';
	import { onMount } from 'svelte';

	interface Props {
		level: LevelDef;
		onBack: () => void;
		onNextLevel?: () => void;
	}

	let { level, onBack, onNextLevel }: Props = $props();

	// svelte-ignore state_referenced_locally
	initGame(level);

	$effect(() => {
		// Re-init when level changes (e.g., "Next Level" button)
		initGame(level);
	});

	let state = $derived(getState());

	$effect(() => {
		if (state.status === 'won') {
			saveProgress(state.level.id, state.turnNumber);
		}
	});

	function handleKey(e: KeyboardEvent) {
		const keyMap: Record<string, Direction> = {
			ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
			w: 'up', s: 'down', a: 'left', d: 'right',
			W: 'up', S: 'down', A: 'left', D: 'right'
		};
		const dir = keyMap[e.key];
		if (dir) {
			e.preventDefault();
			move(dir);
		}
		if (e.key === 'z' || e.key === 'Z') {
			e.preventDefault();
			undo();
		}
		if (e.key === 'r' || e.key === 'R') {
			e.preventDefault();
			restart();
		}
		if ((e.key === 'n' || e.key === 'N' || e.key === 'Enter') && state.status === 'won' && onNextLevel) {
			e.preventDefault();
			onNextLevel();
		}
		if (e.key === 'Escape') {
			e.preventDefault();
			onBack();
		}
		if ((e.key === 'b' || e.key === 'B') && (state.status === 'won' || state.status === 'lost')) {
			e.preventDefault();
			onBack();
		}
	}

	let touchStart: { x: number; y: number } | null = null;
	const SWIPE_THRESHOLD = 30;

	function handleTouchStart(e: TouchEvent) {
		const t = e.touches[0];
		touchStart = { x: t.clientX, y: t.clientY };
	}

	function handleTouchEnd(e: TouchEvent) {
		if (!touchStart) return;
		const t = e.changedTouches[0];
		const dx = t.clientX - touchStart.x;
		const dy = t.clientY - touchStart.y;
		touchStart = null;

		if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

		let dir: Direction;
		if (Math.abs(dx) > Math.abs(dy)) {
			dir = dx > 0 ? 'right' : 'left';
		} else {
			dir = dy > 0 ? 'down' : 'up';
		}
		move(dir);
	}

	onMount(() => {
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="game-container"
	data-testid="game-container"
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
>
	<HUD
		turnNumber={state.turnNumber}
		par={state.level.par}
		status={state.status}
		lostReason={state.lostReason}
		{onBack}
		{onNextLevel}
		onUndo={undo}
		onRestart={restart}
		chickenCount={state.collectedCages.length}
	/>
	<div class="grid-wrapper">
		<Grid {state} />
	</div>
</div>

<style>
	.game-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		height: 100dvh;
		background: #222;
		touch-action: none;
		padding-bottom: env(safe-area-inset-bottom, 0);
	}
	.grid-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
		overflow: hidden;
	}
</style>
