import type { Position } from './types.js';

function expandSegments(waypoints: Position[]): Position[] {
	const result: Position[] = [{ ...waypoints[0] }];

	for (let i = 1; i < waypoints.length; i++) {
		const from = waypoints[i - 1];
		const to = waypoints[i];
		const dx = Math.sign(to.x - from.x);
		const dy = Math.sign(to.y - from.y);

		if (dx !== 0 && dy !== 0) {
			throw new Error(
				`Non-axis-aligned segment from (${from.x},${from.y}) to (${to.x},${to.y})`
			);
		}
		if (dx === 0 && dy === 0) continue; // duplicate point

		let cx = from.x + dx;
		let cy = from.y + dy;
		while (cx !== to.x || cy !== to.y) {
			result.push({ x: cx, y: cy });
			cx += dx;
			cy += dy;
		}
		result.push({ x: to.x, y: to.y });
	}

	return result;
}

export function expandPath(waypoints: Position[], loop: boolean = false): Position[] {
	if (waypoints.length <= 1) return [...waypoints];

	const result = expandSegments(waypoints);

	if (loop && waypoints.length >= 2) {
		const last = waypoints[waypoints.length - 1];
		const first = waypoints[0];
		if (last.x !== first.x || last.y !== first.y) {
			const closing = expandSegments([last, first]);
			// Skip first (already in result) and last (loop wrap handles it)
			for (let i = 1; i < closing.length - 1; i++) {
				result.push(closing[i]);
			}
		}
	}

	return result;
}
