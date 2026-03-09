import { solve } from '../src/lib/engine/solver.js';
import level1 from '../src/lib/levels/level1.json' with { type: 'json' };
import level2 from '../src/lib/levels/level2.json' with { type: 'json' };
import level3 from '../src/lib/levels/level3.json' with { type: 'json' };
import level4 from '../src/lib/levels/level4.json' with { type: 'json' };
import level5 from '../src/lib/levels/level5.json' with { type: 'json' };
import level6 from '../src/lib/levels/level6.json' with { type: 'json' };
import level7 from '../src/lib/levels/level7.json' with { type: 'json' };
import level8 from '../src/lib/levels/level8.json' with { type: 'json' };
import sample from '../src/lib/levels/sample.json' with { type: 'json' };
import type { LevelDef } from '../src/lib/engine/types.js';

for (const level of [sample, level1, level2, level3, level4, level5, level6, level7, level8] as LevelDef[]) {
	const result = solve(level, 200);
	if (result) {
		console.log(`${level.name}: ${result.solution.length} moves (explored ${result.explored} states) [${result.solution.join(', ')}]`);
	} else {
		console.log(`${level.name}: UNSOLVABLE (or > 200 moves)`);
	}
}
