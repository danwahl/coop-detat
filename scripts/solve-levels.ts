import { solve } from '../src/lib/engine/solver.js';
import level1 from '../src/lib/levels/level1.json' with { type: 'json' };
import level2 from '../src/lib/levels/level2.json' with { type: 'json' };
import level3 from '../src/lib/levels/level3.json' with { type: 'json' };
import sample from '../src/lib/levels/sample.json' with { type: 'json' };
import type { LevelDef } from '../src/lib/engine/types.js';

for (const level of [sample, level1, level2, level3] as LevelDef[]) {
	const result = solve(level, 50);
	if (result) {
		console.log(`${level.name}: ${result.solution.length} moves [${result.solution.join(', ')}]`);
	} else {
		console.log(`${level.name}: UNSOLVABLE`);
	}
}
