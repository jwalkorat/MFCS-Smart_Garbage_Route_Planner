/**
 * tests/logic.test.js - Contract & Commit 1 Verification Suite
 */

const assert = require('assert');
const logic = require('../logic.js');
const PRESETS = require('../presets.js');

console.log('=== ROUTEWISE LOGIC TESTS - COMMIT 1 ===');

// 1. All exports are functions
console.log('Checking function exports...');
assert.strictEqual(typeof logic.getDegrees, 'function');
assert.strictEqual(typeof logic.getOddJunctions, 'function');
assert.strictEqual(typeof logic.checkHandshaking, 'function');
assert.strictEqual(typeof logic.isConnected, 'function');
assert.strictEqual(typeof logic.getVerdict, 'function');
assert.strictEqual(typeof logic.shortestPaths, 'function');
assert.strictEqual(typeof logic.getPath, 'function');
assert.strictEqual(typeof logic.findRoute, 'function');
assert.strictEqual(typeof logic.solvePostman, 'function');
console.log('PASS: All required exports are functions');

// Map 1: Practice (hand-calculation)
{
  const map1 = PRESETS[0].graph;
  const deg = logic.getDegrees(map1);
  assert.deepStrictEqual(deg, { A: 3, B: 3, C: 3, D: 3 });

  const odd = logic.getOddJunctions(map1);
  assert.deepStrictEqual(odd, ['A', 'B', 'C', 'D']);

  const hs = logic.checkHandshaking(map1);
  assert.strictEqual(hs.sumOfDegrees, 12);
  assert.strictEqual(hs.twiceStreets, 12);
  assert.strictEqual(hs.holds, true);

  assert.strictEqual(logic.isConnected(map1), true);

  const verdict = logic.getVerdict(map1);
  assert.strictEqual(verdict.type, 'repeats');
  assert.strictEqual(verdict.connected, true);
  assert.deepStrictEqual(verdict.oddJunctions, ['A', 'B', 'C', 'D']);
  assert.strictEqual(verdict.message, '4 odd junctions. Some streets must be repeated.');

  const sp = logic.shortestPaths(map1);
  assert.strictEqual(sp.dist['A']['B'], 2);
  assert.strictEqual(sp.dist['A']['C'], 3);
  assert.strictEqual(sp.dist['A']['D'], 4);
  assert.strictEqual(sp.dist['B']['C'], 5); // via A (2 + 3 = 5 < 6)
  assert.strictEqual(sp.dist['B']['D'], 5);
  assert.strictEqual(sp.dist['C']['D'], 1);

  const pathBC = logic.getPath(sp.next, 'B', 'C');
  assert.deepStrictEqual(pathBC, ['B', 'A', 'C']);
  console.log('PASS: Map 1 (Practice) analysis and shortest paths verified');
}

// Map 2: Circuit (all even)
{
  const map2 = PRESETS[1].graph;
  const deg = logic.getDegrees(map2);
  assert.deepStrictEqual(deg, { A: 2, B: 2, C: 2, D: 2 });

  const odd = logic.getOddJunctions(map2);
  assert.deepStrictEqual(odd, []);

  const hs = logic.checkHandshaking(map2);
  assert.strictEqual(hs.sumOfDegrees, 8);
  assert.strictEqual(hs.twiceStreets, 8);
  assert.strictEqual(hs.holds, true);

  assert.strictEqual(logic.isConnected(map2), true);

  const verdict = logic.getVerdict(map2);
  assert.strictEqual(verdict.type, 'circuit');
  assert.strictEqual(verdict.connected, true);
  assert.deepStrictEqual(verdict.oddJunctions, []);
  assert.deepStrictEqual(verdict.startOptions, ['A', 'B', 'C', 'D']);
  console.log('PASS: Map 2 (Circuit) analysis verified');
}

// Map 3: Path (two odd junctions)
{
  const map3 = PRESETS[2].graph;
  const deg = logic.getDegrees(map3);
  assert.deepStrictEqual(deg, { A: 3, B: 2, C: 3, D: 2 });

  const odd = logic.getOddJunctions(map3);
  assert.deepStrictEqual(odd, ['A', 'C']);

  const hs = logic.checkHandshaking(map3);
  assert.strictEqual(hs.sumOfDegrees, 10);
  assert.strictEqual(hs.twiceStreets, 10);
  assert.strictEqual(hs.holds, true);

  assert.strictEqual(logic.isConnected(map3), true);

  const verdict = logic.getVerdict(map3);
  assert.strictEqual(verdict.type, 'path');
  assert.strictEqual(verdict.connected, true);
  assert.deepStrictEqual(verdict.oddJunctions, ['A', 'C']);
  assert.deepStrictEqual(verdict.startOptions, ['A', 'C']);
  console.log('PASS: Map 3 (Path) analysis verified');
}

// Map 4: Society roads
{
  const map4 = PRESETS[3].graph;
  const deg = logic.getDegrees(map4);
  assert.deepStrictEqual(deg, { A: 2, B: 3, C: 3, D: 2, E: 3, F: 3 });

  const odd = logic.getOddJunctions(map4);
  assert.deepStrictEqual(odd, ['B', 'C', 'E', 'F']);

  const hs = logic.checkHandshaking(map4);
  assert.strictEqual(hs.sumOfDegrees, 16);
  assert.strictEqual(hs.twiceStreets, 16);
  assert.strictEqual(hs.holds, true);

  assert.strictEqual(logic.isConnected(map4), true);

  const verdict = logic.getVerdict(map4);
  assert.strictEqual(verdict.type, 'repeats');
  assert.strictEqual(verdict.connected, true);
  assert.deepStrictEqual(verdict.oddJunctions, ['B', 'C', 'E', 'F']);

  const sp = logic.shortestPaths(map4);
  assert.strictEqual(sp.dist['B']['C'], 80);
  assert.strictEqual(sp.dist['B']['E'], 60);
  assert.strictEqual(sp.dist['B']['F'], 130);
  assert.strictEqual(sp.dist['C']['E'], 140);
  assert.strictEqual(sp.dist['C']['F'], 130);
  assert.strictEqual(sp.dist['E']['F'], 70);
  console.log('PASS: Map 4 (Society roads) analysis and shortest paths verified');
}

// Map 5: Disconnected
{
  const map5 = PRESETS[4].graph;
  assert.strictEqual(logic.isConnected(map5), false);

  const verdict = logic.getVerdict(map5);
  assert.strictEqual(verdict.type, 'not-connected');
  assert.strictEqual(verdict.connected, false);
  assert.deepStrictEqual(verdict.oddJunctions, ['A', 'B', 'C', 'D']);
  console.log('PASS: Map 5 (Disconnected) analysis verified');
}

// Edge Cases: Empty graph, single junction without streets, parallel streets
{
  const emptyGraph = { junctions: [], streets: [] };
  assert.deepStrictEqual(logic.getDegrees(emptyGraph), {});
  assert.deepStrictEqual(logic.getOddJunctions(emptyGraph), []);
  assert.strictEqual(logic.isConnected(emptyGraph), false);
  const emptyVerdict = logic.getVerdict(emptyGraph);
  assert.strictEqual(emptyVerdict.type, 'empty');

  const singleJunction = { junctions: [{ id: 'A', x: 100, y: 100 }], streets: [] };
  assert.deepStrictEqual(logic.getDegrees(singleJunction), { A: 0 });
  assert.deepStrictEqual(logic.getOddJunctions(singleJunction), []);
  assert.strictEqual(logic.isConnected(singleJunction), false);
  assert.strictEqual(logic.getVerdict(singleJunction).type, 'empty');

  const parallelGraph = {
    junctions: [{ id: 'A', x: 0, y: 0 }, { id: 'B', x: 10, y: 10 }],
    streets: [
      { id: 1, from: 'A', to: 'B', length: 8 },
      { id: 2, from: 'A', to: 'B', length: 5 }
    ]
  };
  const parDeg = logic.getDegrees(parallelGraph);
  assert.deepStrictEqual(parDeg, { A: 2, B: 2 });
  const parHs = logic.checkHandshaking(parallelGraph);
  assert.strictEqual(parHs.sumOfDegrees, 4);
  assert.strictEqual(parHs.twiceStreets, 4);
  assert.strictEqual(parHs.holds, true);

  const parSp = logic.shortestPaths(parallelGraph);
  assert.strictEqual(parSp.dist['A']['B'], 5);

  const cheapest = logic.cheapestStreetBetween(parallelGraph, 'A', 'B');
  assert.strictEqual(cheapest.id, 2);
  assert.strictEqual(cheapest.length, 5);

  console.log('PASS: Edge cases (empty, single-junction, parallel streets) verified');
}

console.log('ALL COMMIT 1 TESTS PASSED SUCCESSFULLY!');
