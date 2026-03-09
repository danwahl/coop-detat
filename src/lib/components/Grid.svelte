<script lang="ts">
	import type { GameState, Position } from '$lib/engine/types.js';
	import { getVisibleCells } from '$lib/engine/detection.js';

	interface Props {
		state: GameState;
		showVision?: boolean;
		cellSize?: number;
		onCellClick?: (x: number, y: number) => void;
		onCellDown?: (x: number, y: number) => void;
		onCellOver?: (x: number, y: number) => void;
		editingPath?: Position[];
	}

	let { state, showVision = true, cellSize = 32, onCellClick, onCellDown, onCellOver, editingPath }: Props = $props();

	const CELL_COLORS: Record<string, string> = {
		empty: '#e8e0d4',
		wall: '#4a4a4a',
		cage: '#9e9e9e',
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

	function isPendingCage(x: number, y: number): boolean {
		if (!state.pendingChicken || state.collectedCages.length === 0) return false;
		const last = state.collectedCages[state.collectedCages.length - 1];
		return last.x === x && last.y === y;
	}
</script>

<svg
	data-testid="game-grid"
	viewBox="0 0 {state.level.width * cellSize} {state.level.height * cellSize}"
	style="max-width: 100%; max-height: 100%; display: block;"
>
	<!-- Grid cells -->
	{#each state.level.grid as row, gy}
		{#each row as cell, gx}
			{@const isCageCollected = cell === 'cage' && collectedSet.has(`${gx},${gy}`)}
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<rect
				data-testid="cell-{gx}-{gy}"
				x={gx * cellSize}
				y={gy * cellSize}
				width={cellSize}
				height={cellSize}
				fill={isCageCollected ? '#bdbdbd' : CELL_COLORS[cell]}
				stroke="#ccc"
				stroke-width="0.5"
				onclick={() => onCellClick?.(gx, gy)}
				onpointerdown={() => onCellDown?.(gx, gy)}
				onpointerover={() => onCellOver?.(gx, gy)}
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

	<!-- Editing path preview -->
	{#if editingPath && editingPath.length > 0}
		{#if editingPath.length > 1}
			<polyline
				points={editingPath.map(p => `${p.x * cellSize + cellSize / 2},${p.y * cellSize + cellSize / 2}`).join(' ')}
				fill="none"
				stroke="rgba(33, 150, 243, 0.6)"
				stroke-width="3"
				stroke-dasharray="6 3"
			/>
		{/if}
		{#each editingPath as point, i}
			<circle
				cx={point.x * cellSize + cellSize / 2}
				cy={point.y * cellSize + cellSize / 2}
				r={cellSize / 6}
				fill={i === 0 ? '#4CAF50' : '#2196F3'}
				stroke="white"
				stroke-width="1"
			/>
			{#if i === 0 && editingPath.length >= 2}
				<circle
					cx={point.x * cellSize + cellSize / 2}
					cy={point.y * cellSize + cellSize / 2}
					r={cellSize / 4}
					fill="none"
					stroke="#4CAF50"
					stroke-width="1.5"
					opacity="0.5"
				>
					<animate attributeName="r" values="{cellSize/4};{cellSize/3};{cellSize/4}" dur="1.5s" repeatCount="indefinite" />
					<animate attributeName="opacity" values="0.5;0.2;0.5" dur="1.5s" repeatCount="indefinite" />
				</circle>
			{/if}
		{/each}
	{/if}

	<!-- Exit marker -->
	<text
		data-testid="exit-marker"
		x={state.level.exit.x * cellSize + cellSize / 2}
		y={state.level.exit.y * cellSize + cellSize / 2}
		text-anchor="middle"
		dominant-baseline="central"
		font-size={cellSize * 0.7}
		style="pointer-events: none"
	>&#x1F6AA;</text>

	<!-- Snake body (rescued chickens) -->
	{#each state.snake as seg, i}
		{#if i > 0}
			{@const tilt = ((state.turnNumber + i) % 2 === 0) ? 12 : -12}
			<text
				data-testid="snake-segment-{i}"
				x={seg.x * cellSize + cellSize / 2}
				y={seg.y * cellSize + cellSize / 2}
				text-anchor="middle"
				dominant-baseline="central"
				font-size={cellSize * 0.6}
				style="pointer-events: none"
				transform="rotate({tilt}, {seg.x * cellSize + cellSize / 2}, {seg.y * cellSize + cellSize / 2})"
			>&#x1F414;</text>
		{/if}
	{/each}

	<!-- Player head (ninja) -->
	<text
		data-testid="player-head"
		x={state.playerPos.x * cellSize + cellSize / 2}
		y={state.playerPos.y * cellSize + cellSize / 2}
		text-anchor="middle"
		dominant-baseline="central"
		font-size={cellSize * 0.7}
		style="pointer-events: none"
	>&#x1F977;</text>

	<!-- Guards -->
	{#each state.guards as guard}
		{@const gp = guardPos(guard)}
		<text
			data-testid="guard-{guard.id}"
			x={gp.x * cellSize + cellSize / 2}
			y={gp.y * cellSize + cellSize / 2}
			text-anchor="middle"
			dominant-baseline="central"
			font-size={cellSize * 0.7}
			style="pointer-events: none"
		>&#x1F46E;</text>
	{/each}

	<!-- Cameras -->
	{#each state.cameras as camera}
		<text
			data-testid="camera-{camera.id}"
			x={camera.pos.x * cellSize + cellSize / 2}
			y={camera.pos.y * cellSize + cellSize / 2}
			text-anchor="middle"
			dominant-baseline="central"
			font-size={cellSize * 0.7}
			style="pointer-events: none"
		>&#x1F3A5;</text>
	{/each}

	<!-- Cage chickens + bars (bars render on top of chicken) -->
	{#each state.level.grid as row, cy}
		{#each row as cell, cx}
			{#if cell === 'cage'}
				{@const isCageCollected = collectedSet.has(`${cx},${cy}`)}
				{#if !isCageCollected || isPendingCage(cx, cy)}
					<text
						x={cx * cellSize + cellSize / 2}
						y={cy * cellSize + cellSize / 2}
						text-anchor="middle"
						dominant-baseline="central"
						font-size={cellSize * 0.5}
						style="pointer-events: none"
					>&#x1F414;</text>
				{/if}
				{#each [0.25, 0.5, 0.75] as ratio}
					<line
						x1={cx * cellSize + cellSize * ratio}
						y1={cy * cellSize + 2}
						x2={cx * cellSize + cellSize * ratio}
						y2={(cy + 1) * cellSize - 2}
						stroke={isCageCollected ? 'rgba(50, 50, 50, 0.2)' : 'rgba(50, 50, 50, 0.6)'}
						stroke-width="2"
						stroke-linecap="round"
						style="pointer-events: none"
					/>
				{/each}
			{/if}
		{/each}
	{/each}
</svg>
