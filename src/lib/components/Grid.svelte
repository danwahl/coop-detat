<script lang="ts">
	import type { GameState, Direction, Position } from '$lib/engine/types.js';
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

	const DIRECTION_ARROWS: Record<Direction, string> = {
		up: '0,-6 -4,4 4,4',
		down: '0,6 -4,-4 4,-4',
		left: '-6,0 4,-4 4,4',
		right: '6,0 -4,-4 -4,4'
	};

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

	<!-- Exit marker -->
	<rect
		data-testid="exit-marker"
		x={state.level.exit.x * cellSize + 4}
		y={state.level.exit.y * cellSize + 4}
		width={cellSize - 8}
		height={cellSize - 8}
		fill="none"
		stroke="#2E7D32"
		stroke-width="2"
		rx="4"
	/>

	<!-- Snake body -->
	{#each state.snake as seg, i}
		{#if i > 0}
			<circle
				data-testid="snake-segment-{i}"
				cx={seg.x * cellSize + cellSize / 2}
				cy={seg.y * cellSize + cellSize / 2}
				r={cellSize / 3}
				fill="#FFD54F"
				stroke="#F9A825"
				stroke-width="1.5"
			/>
		{/if}
	{/each}

	<!-- Player head -->
	<circle
		data-testid="player-head"
		cx={state.playerPos.x * cellSize + cellSize / 2}
		cy={state.playerPos.y * cellSize + cellSize / 2}
		r={cellSize / 2.5}
		fill="#FF7043"
		stroke="#D84315"
		stroke-width="2"
	/>

	<!-- Guards -->
	{#each state.guards as guard}
		{@const gp = guardPos(guard)}
		<polygon
			data-testid="guard-{guard.id}"
			points={DIRECTION_ARROWS[guard.facing]}
			transform="translate({gp.x * cellSize + cellSize / 2}, {gp.y * cellSize + cellSize / 2})"
			fill="#2196F3"
			stroke="#0D47A1"
			stroke-width="1"
		/>
	{/each}

	<!-- Cameras -->
	{#each state.cameras as camera}
		{@const facing = camera.directions[camera.dirIndex]}
		<rect
			data-testid="camera-{camera.id}"
			x={camera.pos.x * cellSize + 6}
			y={camera.pos.y * cellSize + 6}
			width={cellSize - 12}
			height={cellSize - 12}
			fill="#9C27B0"
			stroke="#4A148C"
			stroke-width="1"
			rx="2"
		/>
		<polygon
			points={DIRECTION_ARROWS[facing]}
			transform="translate({camera.pos.x * cellSize + cellSize / 2}, {camera.pos.y * cellSize + cellSize / 2}) scale(0.7)"
			fill="white"
		/>
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
