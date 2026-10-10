const assert = require("assert");
const logic = require("../logic");
const PRESETS = require("../presets");

console.log("=== ROUTEWISE LOGIC TESTS - COMMIT 2 ===");

// 1. All exports are functions
console.log("Checking function exports...");
assert.strictEqual(typeof logic.getDegrees, "function");
assert.strictEqual(typeof logic.getOddJunctions, "function");
assert.strictEqual(typeof logic.checkHandshaking, "function");
assert.strictEqual(typeof logic.isConnected, "function");
assert.strictEqual(typeof logic.getVerdict, "function");
assert.strictEqual(typeof logic.shortestPaths, "function");
assert.strictEqual(typeof logic.getPath, "function");
assert.strictEqual(typeof logic.generatePairings, "function");
assert.strictEqual(typeof logic.eulerWalk, "function");
assert.strictEqual(typeof logic.findRoute, "function");
assert.strictEqual(typeof logic.solvePostman, "function");
console.log("PASS: All required exports are functions");

// Helper to verify route properties
function verifyRouteProperties(graph, result, expectedType, expectedTotal) {
  assert.strictEqual(result.ok, true, "Result must be ok: true");
  assert.strictEqual(result.type, expectedType, `Expected type ${expectedType}`);
  assert.strictEqual(result.totalDistance, expectedTotal, `Total distance must equal ${expectedTotal}`);

  const steps = result.steps;
  assert.ok(steps.length > 0, "Steps must not be empty");

  // Sum of lengths and last runningTotal
  let sumLengths = 0;
  for (let i = 0; i < steps.length; i++) {
    sumLengths += steps[i].length;
    assert.strictEqual(steps[i].runningTotal, sumLengths, `Running total mismatch at step ${i + 1}`);
    assert.strictEqual(steps[i].index, i + 1, `Step index must match 1-based index`);
  }
  assert.strictEqual(sumLengths, expectedTotal, "Sum of step lengths must equal expected total");
  assert.strictEqual(steps[steps.length - 1].runningTotal, expectedTotal, "Final running total must equal totalDistance");

  // Consecutive steps join
  for (let i = 0; i < steps.length - 1; i++) {
    assert.strictEqual(steps[i].to, steps[i + 1].from, `Discontinuous step at index ${i + 1} (${steps[i].to} !== ${steps[i+1].from})`);
  }

  // Route matches steps
  assert.strictEqual(result.route[0], steps[0].from, "Route start must match first step.from");
  assert.strictEqual(result.route[result.route.length - 1], steps[steps.length - 1].to, "Route end must match last step.to");
  assert.strictEqual(result.route.length, steps.length + 1, "Route length must be steps.length + 1");

  // Circuit vs Path endpoints
  if (expectedType === "circuit" || expectedType === "repeats") {
    assert.strictEqual(result.route[0], result.route[result.route.length - 1], "Circuit must start and end at the same junction");
  } else if (expectedType === "path") {
    const odds = logic.getOddJunctions(graph);
    const startNode = result.route[0];
    const endNode = result.route[result.route.length - 1];
    assert.ok(odds.includes(startNode), "Path must start at an odd junction");
    assert.ok(odds.includes(endNode), "Path must end at an odd junction");
    assert.notStrictEqual(startNode, endNode, "Path start and end must differ");
  }

  // Check street coverage
  const nonRepeatSteps = steps.filter(s => !s.isRepeat);
  const repeatSteps = steps.filter(s => s.isRepeat);

  // Every original street appears exactly once in nonRepeatSteps
  const originalStreetIds = graph.streets.map(s => s.id);
  const coveredIds = nonRepeatSteps.map(s => s.streetId);
  assert.deepStrictEqual(coveredIds.sort((a, b) => a - b), originalStreetIds.sort((a, b) => a - b),
    "Every original street must appear exactly once among non-repeat steps");

  // Each repeated street has isRepeat: true
  for (const rep of repeatSteps) {
    assert.strictEqual(rep.isRepeat, true);
    assert.ok(result.repeatedStreetIds.includes(rep.streetId), "Repeated step id must be in repeatedStreetIds");
  }
}

// 2. Map 1 (Practice): repeats, 8 steps, total 24
{
  const map1 = PRESETS[0].graph;
  const initialCopy = JSON.stringify(map1);

  const res = logic.solvePostman(map1, "A");
  assert.strictEqual(JSON.stringify(map1), initialCopy, "solvePostman must not mutate graph");

  verifyRouteProperties(map1, res, "repeats", 24);
  assert.strictEqual(res.steps.length, 8);
  assert.strictEqual(res.originalLength, 21);
  assert.strictEqual(res.extraDistance, 3);
  assert.strictEqual(res.pairingsTried, 3);

  // Check pairing costs: [3, 8, 9]
  const costs = res.pairings.map(p => p.cost);
  assert.deepStrictEqual(costs, [3, 8, 9]);
  assert.strictEqual(res.pairings[0].chosen, true);
  assert.strictEqual(res.pairings[1].chosen, false);
  assert.strictEqual(res.pairings[2].chosen, false);

  // Best pairing is {AB, CD}
  assert.deepStrictEqual(res.pairings[0].pairs, [["A", "B"], ["C", "D"]]);
  assert.deepStrictEqual(res.repeatedStreetIds.sort((a, b) => a - b), [1, 6]);

  console.log("PASS: Map 1 (Practice) Postman solved: total 24, costs [3, 8, 9], 8 steps");
}

// 3. Map 2 (Circuit): circuit, 4 steps, total 400
{
  const map2 = PRESETS[1].graph;
  const resCircuit = logic.findRoute(map2, "A");
  assert.strictEqual(resCircuit.ok, true);
  assert.strictEqual(resCircuit.totalDistance, 400);
  assert.strictEqual(resCircuit.steps.length, 4);

  const res = logic.solvePostman(map2, "A");
  verifyRouteProperties(map2, res, "circuit", 400);
  assert.strictEqual(res.steps.length, 4);
  assert.strictEqual(res.extraDistance, 0);
  assert.deepStrictEqual(res.pairings, []);
  assert.strictEqual(res.pairingsTried, 0);
  assert.deepStrictEqual(res.repeatedStreetIds, []);

  console.log("PASS: Map 2 (Circuit) solved: total 400, 4 steps");
}

// 4. Map 3 (Path): path, 5 steps, total 20
{
  const map3 = PRESETS[2].graph;
  const resPath = logic.findRoute(map3, "A");
  assert.strictEqual(resPath.ok, true);
  assert.strictEqual(resPath.totalDistance, 20);
  assert.strictEqual(resPath.steps.length, 5);
  assert.strictEqual(resPath.start, "A");
  assert.strictEqual(resPath.end, "C");

  const res = logic.solvePostman(map3, "A");
  verifyRouteProperties(map3, res, "path", 20);
  assert.strictEqual(res.steps.length, 5);
  assert.strictEqual(res.extraDistance, 0);

  // Can also start at C
  const resC = logic.findRoute(map3, "C");
  assert.strictEqual(resC.ok, true);
  assert.strictEqual(resC.start, "C");
  assert.strictEqual(resC.end, "A");

  console.log("PASS: Map 3 (Path) solved: total 20, 5 steps (A to C)");
}

// 5. Map 4 (Society roads): repeats, 10 steps, total 910
{
  const map4 = PRESETS[3].graph;
  const res = logic.solvePostman(map4, "A");
  verifyRouteProperties(map4, res, "repeats", 910);
  assert.strictEqual(res.steps.length, 10);
  assert.strictEqual(res.originalLength, 760);
  assert.strictEqual(res.extraDistance, 150);
  assert.strictEqual(res.pairingsTried, 3);

  // Check pairing costs: [150, 190, 270]
  const costs = res.pairings.map(p => p.cost);
  assert.deepStrictEqual(costs, [150, 190, 270]);
  assert.strictEqual(res.pairings[0].chosen, true);

  console.log("PASS: Map 4 (Society roads) solved: total 910, costs [150, 190, 270], 10 steps");
}

// 6. Map 5 (Disconnected): error handling
{
  const map5 = PRESETS[4].graph;
  const resPostman = logic.solvePostman(map5);
  assert.strictEqual(resPostman.ok, false);
  assert.strictEqual(resPostman.type, "not-connected");
  assert.strictEqual(resPostman.error, "The streets are not all connected, so no single route can cover them.");

  const resFind = logic.findRoute(map5);
  assert.strictEqual(resFind.ok, false);
  console.log("PASS: Map 5 (Disconnected) properly rejected");
}

// 7. Pairing generator combinatorial counts
{
  const p4 = logic.generatePairings(["A", "B", "C", "D"]);
  assert.strictEqual(p4.length, 3, "(4-1)!! = 3 pairings");

  const p6 = logic.generatePairings(["A", "B", "C", "D", "E", "F"]);
  assert.strictEqual(p6.length, 15, "(6-1)!! = 15 pairings");

  const p8 = logic.generatePairings(["A", "B", "C", "D", "E", "F", "G", "H"]);
  assert.strictEqual(p8.length, 105, "(8-1)!! = 105 pairings");

  console.log("PASS: Combinatorial pairing counts verified (3 for 4, 15 for 6, 105 for 8)");
}

// 8. Error cases & Edge cases
{
  // Empty graph
  const emptyRes = logic.solvePostman({ junctions: [], streets: [] });
  assert.strictEqual(emptyRes.ok, false);
  assert.strictEqual(emptyRes.type, "empty");

  // Single junction
  const singleRes = logic.solvePostman({ junctions: [{ id: "A", x: 0, y: 0 }], streets: [] });
  assert.strictEqual(singleRes.ok, false);
  assert.strictEqual(singleRes.type, "empty");

  // findRoute on Map 3 with invalid start 'B'
  const invalidStartRes = logic.findRoute(PRESETS[2].graph, "B");
  assert.strictEqual(invalidStartRes.ok, false);
  assert.ok(invalidStartRes.error.includes("Start junction not allowed"));

  // findRoute on Map 1 (which requires repeats)
  const map1FindRes = logic.findRoute(PRESETS[0].graph, "A");
  assert.strictEqual(map1FindRes.ok, false);
  assert.ok(map1FindRes.error.includes("No Euler route exists"));

  // Two odd junctions that are not directly connected (A - B - C)
  const lineGraph = {
    junctions: [{ id: "A", x: 0, y: 0 }, { id: "B", x: 50, y: 0 }, { id: "C", x: 100, y: 0 }],
    streets: [
      { id: 1, from: "A", to: "B", length: 10 },
      { id: 2, from: "B", to: "C", length: 20 }
    ]
  };
  const lineVerdict = logic.getVerdict(lineGraph);
  assert.strictEqual(lineVerdict.type, "path");
  assert.deepStrictEqual(lineVerdict.startOptions, ["A", "C"]);
  const lineRoute = logic.findRoute(lineGraph, "A");
  assert.strictEqual(lineRoute.ok, true);
  assert.strictEqual(lineRoute.totalDistance, 30);
  assert.deepStrictEqual(lineRoute.route, ["A", "B", "C"]);

  // Custom graph where cheapest pairing goes through intermediate junction (Map 1 B to C via A)
  const spMap1 = logic.shortestPaths(PRESETS[0].graph);
  assert.strictEqual(spMap1.dist["B"]["C"], 5);
  const pathBC = logic.getPath(spMap1.next, "B", "C");
  assert.deepStrictEqual(pathBC, ["B", "A", "C"]);

  // Parallel street preservation in getDegrees
  const parGraph = {
    junctions: [{ id: "A", x: 0, y: 0 }, { id: "B", x: 10, y: 10 }],
    streets: [
      { id: 1, from: "A", to: "B", length: 10 },
      { id: 2, from: "A", to: "B", length: 10 }
    ]
  };
  assert.deepStrictEqual(logic.getDegrees(parGraph), { A: 2, B: 2 });
  const parVerdict = logic.getVerdict(parGraph);
  assert.strictEqual(parVerdict.type, "circuit");

  // Graph immutability
  const mapCopy = JSON.parse(JSON.stringify(PRESETS[0].graph));
  logic.getDegrees(mapCopy);
  logic.getOddJunctions(mapCopy);
  logic.checkHandshaking(mapCopy);
  logic.isConnected(mapCopy);
  logic.getVerdict(mapCopy);
  logic.shortestPaths(mapCopy);
  logic.findRoute(mapCopy, "A");
  logic.solvePostman(mapCopy, "A");
  assert.deepStrictEqual(mapCopy, PRESETS[0].graph, "Graph must remain strictly identical after all calls");

  // Too many odd junctions (> 12)
  const largeOddGraph = {
    junctions: Array.from({ length: 14 }, (_, i) => ({ id: `J${i}`, x: i * 10, y: 0 })),
    streets: Array.from({ length: 7 }, (_, i) => ({ id: i + 1, from: `J${2 * i}`, to: `J${2 * i + 1}`, length: 10 }))
  };
  // Note: disconnected will trigger first if not connected, let's connect them with a central hub
  const hub = { id: "HUB", x: 50, y: 50 };
  largeOddGraph.junctions.push(hub);
  // Each of the 14 vertices has 1 edge to HUB plus 1 edge in pairs -> degree 2.
  // Make 14 isolated pairs connected by 1 edge each:
  // If we have 14 vertices of degree 1 (all connected to a center with even degree):
  const hubGraph = {
    junctions: [{ id: "H", x: 0, y: 0 }, ...Array.from({ length: 14 }, (_, i) => ({ id: `P${i}`, x: 10, y: i * 10 }))],
    streets: Array.from({ length: 14 }, (_, i) => ({ id: i + 1, from: "H", to: `P${i}`, length: 5 }))
  };
  const hubVerdict = logic.getVerdict(hubGraph);
  assert.strictEqual(hubVerdict.oddJunctions.length, 14);
  const largeRes = logic.solvePostman(hubGraph);
  assert.strictEqual(largeRes.ok, false);
  assert.strictEqual(largeRes.error, "Too many odd junctions (max 12)");

  console.log("PASS: All error and edge cases verified");
}

console.log("ALL COMMIT 2 TESTS PASSED SUCCESSFULLY!");
