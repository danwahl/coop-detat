<script lang="ts">
	import type { GameState, Position } from '$lib/engine/types.js';
	import { getVisibleCells } from '$lib/engine/detection.js';

	interface Props {
		state: GameState;
		showVision?: boolean;
		cellSize?: number;
		onCellClick?: (x: number, y: number) => void;
	}

	let { state, showVision = true, cellSize = 32, onCellClick }: Props = $props();

	const CELL_COLORS: Record<string, string> = {
		empty: '#e8e0d4',
		wall: '#4a4a4a',
		cage: '#8B6914',
		exit: '#4CAF50'
	};

	let visibleSet = $derived.by(() => {
		if (!showVision) return new Set<string>();
		const set = new Set<string>();
		for (const guard of state.guards) {
			const pos = guard.path[guard.pathIndex];
			for (const v of getVisibleCells(pos, guard.facing, guard.visionRange, state)) {
				set.add(`${v.x},${v.y}`);
			}
		}
		for (const camera of state.cameras) {
			const facing = camera.directions[camera.dirIndex];
			for (const v of getVisibleCells(camera.pos, facing, camera.visionRange, state)) {
				set.add(`${v.x},${v.y}`);
			}
		}
		return set;
	});

	let collectedSet = $derived(new Set(state.collectedCages.map((p: Position) => `${p.x},${p.y}`)));

	function guardPos(guard: { path: Position[]; pathIndex: number }): Position {
		return guard.path[guard.pathIndex];
	}
</script>

<svg
	data-testid="game-grid"
	viewBox="0 0 {state.level.width * cellSize} {state.level.height * cellSize}"
	style="max-width: 100%; max-height: 100%; display: block;"
>
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<!-- Grid cells -->
	{#each state.level.grid as row, gy}
		{#each row as cell, gx}
			{@const isCageCollected = cell === 'cage' && collectedSet.has(`${gx},${gy}`)}
			<rect
				data-testid="cell-{gx}-{gy}"
				x={gx * cellSize}
				y={gy * cellSize}
				width={cellSize}
				height={cellSize}
				fill={isCageCollected ? '#a89060' : CELL_COLORS[cell]}
				stroke="#ccc"
				stroke-width="0.5"
				onclick={() => onCellClick?.(gx, gy)}
			/>
		{/each}
	{/each}

	<!-- Vision overlay -->
	{#each [...visibleSet] as key}
		{@const [vx, vy] = key.split(',').map(Number)}
		<rect
			data-testid="vision-{vx}-{vy}"
			x={vx * cellSize}
			y={vy * cellSize}
			width={cellSize}
			height={cellSize}
			fill="rgba(255, 0, 0, 0.15)"
		/>
	{/each}

	<!-- Guard patrol paths -->
	{#each state.guards as guard}
		<polyline
			points={guard.path.map(p => `${p.x * cellSize + cellSize / 2},${p.y * cellSize + cellSize / 2}`).join(' ')}
			fill="none"
			stroke="rgba(33, 150, 243, 0.25)"
			stroke-width="2"
			stroke-dasharray="4 4"
		/>
	{/each}

	<!-- Exit marker -->
	<text
		data-testid="exit-marker"
		x={state.level.exit.x * cellSize + cellSize / 2}
		y={state.level.exit.y * cellSize + cellSize / 2 + cellSize * 0.15}
		text-anchor="middle"
		font-size={cellSize * 0.7}
		style="pointer-events: none"
	>&#x1F6AA;</text>

	<!-- Snake body -->
	{#each state.snake as seg, i}
		{#if i > 0}
			<text
				data-testid="snake-segment-{i}"
				x={seg.x * cellSize + cellSize / 2}
				y={seg.y * cellSize + cellSize / 2 + cellSize * 0.15}
				text-anchor="middle"
				font-size={cellSize * 0.6}
				style="pointer-events: none"
			>&#x1F95A;</text>
		{/if}
	{/each}

	<!-- Player head -->
	<text
		data-testid="player-head"
		x={state.playerPos.x * cellSize + cellSize / 2}
		y={state.playerPos.y * cellSize + cellSize / 2 + cellSize * 0.15}
		text-anchor="middle"
		font-size={cellSize * 0.7}
		style="pointer-events: none"
	>&#x1F414;</text>

	<!-- Guards -->
	{#each state.guards as guard}
		{@const gp = guardPos(guard)}
		<text
			data-testid="guard-{guard.id}"
			x={gp.x * cellSize + cellSize / 2}
			y={gp.y * cellSize + cellSize / 2 + cellSize * 0.15}
			text-anchor="middle"
			font-size={cellSize * 0.7}
			style="pointer-events: none"
		>&#x1F46E;</text>
	{/each}

	<!-- Cameras -->
	{#each state.cameras as camera}
		<text
			data-testid="camera-{camera.id}"
			x={camera.pos.x * cellSize + cellSize / 2}
			y={camera.pos.y * cellSize + cellSize / 2 + cellSize * 0.15}
			text-anchor="middle"
			font-size={cellSize * 0.7}
			style="pointer-events: none"
		>&#x1F4F7;</text>
	{/each}

	<!-- Cage chickens (uncollected) -->
	{#each state.level.grid as row, cy}
		{#each row as cell, cx}
			{#if cell === 'cage' && !collectedSet.has(`${cx},${cy}`)}
				<text
					x={cx * cellSize + cellSize / 2}
					y={cy * cellSize + cellSize / 2 + 5}
					text-anchor="middle"
					font-size={cellSize * 0.5}
					style="pointer-events: none"
				>&#x1F414;</text>
			{/if}
		{/each}
	{/each}
</svg>
