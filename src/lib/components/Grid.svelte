<script lang="ts">
	import type { GameState, Position } from '$lib/engine/types.js';
	import { getVisibleCells } from '$lib/engine/detection.js';
	import ninjaUrl from '$lib/assets/emoji/ninja.svg';
	import chickenUrl from '$lib/assets/emoji/chicken.svg';
	import guardUrl from '$lib/assets/emoji/guard.svg';
	import cameraUrl from '$lib/assets/emoji/camera.svg';
	import doorUrl from '$lib/assets/emoji/door.svg';

	interface Props {
		state: GameState;
		showVision?: boolean;
		cellSize?: number;
		onCellClick?: (x: number, y: number) => void;
		onCellDrag?: (x: number, y: number) => void;
		editingPath?: Position[];
	}

	let { state, showVision = true, cellSize = 32, onCellClick, onCellDrag, editingPath }: Props = $props();

	let svgRef: SVGSVGElement;
	let isDragging = false;
	let lastDragCell: { x: number; y: number } | null = null;

	function getCellFromPointer(e: PointerEvent): { x: number; y: number } | null {
		if (!svgRef) return null;
		const rect = svgRef.getBoundingClientRect();
		const scaleX = (state.level.width * cellSize) / rect.width;
		const scaleY = (state.level.height * cellSize) / rect.height;
		const svgX = (e.clientX - rect.left) * scaleX;
		const svgY = (e.clientY - rect.top) * scaleY;
		const gx = Math.floor(svgX / cellSize);
		const gy = Math.floor(svgY / cellSize);
		if (gx < 0 || gy < 0 || gx >= state.level.width || gy >= state.level.height) return null;
		return { x: gx, y: gy };
	}

	function handleSvgPointerDown(e: PointerEvent) {
		const cell = getCellFromPointer(e);
		if (!cell) return;
		if (onCellDrag) {
			isDragging = true;
			lastDragCell = cell;
			onCellDrag(cell.x, cell.y);
			svgRef.setPointerCapture(e.pointerId);
		} else {
			onCellClick?.(cell.x, cell.y);
		}
	}

	function handleSvgPointerMove(e: PointerEvent) {
		if (!isDragging || !onCellDrag) return;
		const cell = getCellFromPointer(e);
		if (!cell) return;
		if (lastDragCell && cell.x === lastDragCell.x && cell.y === lastDragCell.y) return;
		onCellDrag(cell.x, cell.y);
		lastDragCell = cell;
	}

	function handleSvgPointerUp() {
		isDragging = false;
		lastDragCell = null;
	}

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

	let drainsStarted = $derived.by(() => {
		if (state.status === 'won') return true;
		if (state.status === 'lost' || state.status === 'exiting') {
			const totalCages = state.level.grid.flat().filter(c => c === 'cage').length;
			const allCollected = state.collectedCages.length >= totalCages;
			const onExit = state.playerPos.x === state.level.exit.x
				&& state.playerPos.y === state.level.exit.y;
			return allCollected && onExit && state.snake.length < totalCages + 1;
		}
		return false;
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<svg
	bind:this={svgRef}
	data-testid="game-grid"
	viewBox="0 0 {state.level.width * cellSize} {state.level.height * cellSize}"
	style="touch-action: none; max-width: 100%; max-height: 100%; display: block;"
	onpointerdown={handleSvgPointerDown}
	onpointermove={handleSvgPointerMove}
	onpointerup={handleSvgPointerUp}
	onpointercancel={handleSvgPointerUp}
>
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
				fill={isCageCollected ? '#bdbdbd' : CELL_COLORS[cell]}
				stroke="#ccc"
				stroke-width="0.5"
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
		{@const pathPoints = guard.path.map(p => `${p.x * cellSize + cellSize / 2},${p.y * cellSize + cellSize / 2}`)}
		{@const points = guard.patrolMode === 'loop' ? [...pathPoints, pathPoints[0]].join(' ') : pathPoints.join(' ')}
		<polyline
			points={points}
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
	<image
		data-testid="exit-marker"
		href={doorUrl}
		x={state.level.exit.x * cellSize + cellSize * 0.15}
		y={state.level.exit.y * cellSize + cellSize * 0.15}
		width={cellSize * 0.7}
		height={cellSize * 0.7}
		style="pointer-events: none"
	/>

	<!-- Snake body (rescued chickens) -->
	{#each state.snake as seg, i}
		{#if i > 0 || drainsStarted}
			{@const tilt = ((state.turnNumber + i) % 2 === 0) ? 7 : -7}
			{@const segCx = seg.x * cellSize + cellSize / 2}
			{@const segCy = seg.y * cellSize + cellSize / 2}
			<image
				data-testid="snake-segment-{i}"
				href={chickenUrl}
				x={seg.x * cellSize + cellSize * 0.2}
				y={seg.y * cellSize + cellSize * 0.2}
				width={cellSize * 0.6}
				height={cellSize * 0.6}
				style="pointer-events: none"
				transform="rotate({tilt}, {segCx}, {segCy})"
			/>
		{/if}
	{/each}

	<!-- Player head (ninja) — hide once draining starts -->
	{#if !drainsStarted}
		<image
			data-testid="player-head"
			href={ninjaUrl}
			x={state.playerPos.x * cellSize + cellSize * 0.15}
			y={state.playerPos.y * cellSize + cellSize * 0.15}
			width={cellSize * 0.7}
			height={cellSize * 0.7}
			style="pointer-events: none"
		/>
	{/if}

	<!-- Guards -->
	{#each state.guards as guard}
		{@const gp = guardPos(guard)}
		<image
			data-testid="guard-{guard.id}"
			href={guardUrl}
			x={gp.x * cellSize + cellSize * 0.15}
			y={gp.y * cellSize + cellSize * 0.15}
			width={cellSize * 0.7}
			height={cellSize * 0.7}
			style="pointer-events: none"
		/>
	{/each}

	<!-- Cameras -->
	{#each state.cameras as camera}
		{@const facing = camera.directions[camera.dirIndex]}
		{@const camCx = camera.pos.x * cellSize + cellSize / 2}
		{@const camCy = camera.pos.y * cellSize + cellSize / 2}
		{@const cameraTransform = { left: '', right: `scale(-1, 1)`, down: `rotate(-90)`, up: `rotate(90)` }[facing]}
		<image
			data-testid="camera-{camera.id}"
			href={cameraUrl}
			x={camera.pos.x * cellSize + cellSize * 0.15}
			y={camera.pos.y * cellSize + cellSize * 0.15}
			width={cellSize * 0.7}
			height={cellSize * 0.7}
			style="pointer-events: none"
			transform={cameraTransform}
			transform-origin="{camCx} {camCy}"
		/>
	{/each}

	<!-- Cage chickens + bars -->
	{#each state.level.grid as row, cy}
		{#each row as cell, cx}
			{#if cell === 'cage'}
				{@const isCageCollected = collectedSet.has(`${cx},${cy}`)}
				{@const isPending = isPendingCage(cx, cy)}
				{#if !isCageCollected}
					<!-- Caged: small chicken behind bars -->
					<image
						href={chickenUrl}
						x={cx * cellSize + cellSize * 0.25}
						y={cy * cellSize + cellSize * 0.25}
						width={cellSize * 0.5}
						height={cellSize * 0.5}
						style="pointer-events: none"
					/>
					{#each [0.25, 0.5, 0.75] as ratio}
						<line
							x1={cx * cellSize + cellSize * ratio}
							y1={cy * cellSize + 2}
							x2={cx * cellSize + cellSize * ratio}
							y2={(cy + 1) * cellSize - 2}
							stroke="rgba(50, 50, 50, 0.6)"
							stroke-width="2"
							stroke-linecap="round"
							style="pointer-events: none"
						/>
					{/each}
				{:else if isPending}
					<!-- Being rescued: faded bars, then full-size chicken on top -->
					{#each [0.25, 0.5, 0.75] as ratio}
						<line
							x1={cx * cellSize + cellSize * ratio}
							y1={cy * cellSize + 2}
							x2={cx * cellSize + cellSize * ratio}
							y2={(cy + 1) * cellSize - 2}
							stroke="rgba(50, 50, 50, 0.2)"
							stroke-width="2"
							stroke-linecap="round"
							style="pointer-events: none"
						/>
					{/each}
					<image
						href={chickenUrl}
						x={cx * cellSize + cellSize * 0.2}
						y={cy * cellSize + cellSize * 0.2}
						width={cellSize * 0.6}
						height={cellSize * 0.6}
						style="pointer-events: none"
					/>
				{:else}
					<!-- Collected: empty cage with faded bars -->
					{#each [0.25, 0.5, 0.75] as ratio}
						<line
							x1={cx * cellSize + cellSize * ratio}
							y1={cy * cellSize + 2}
							x2={cx * cellSize + cellSize * ratio}
							y2={(cy + 1) * cellSize - 2}
							stroke="rgba(50, 50, 50, 0.2)"
							stroke-width="2"
							stroke-linecap="round"
							style="pointer-events: none"
						/>
					{/each}
				{/if}
			{/if}
		{/each}
	{/each}
</svg>
