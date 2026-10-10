// RouteWise Graph Theory Logic Engine
// Mathematical Foundations for Computer Science (2CS802CC26), Nirma University
// Pure discrete mathematics: Euler's theorems, Floyd-Warshall, and Chinese Postman algorithms.

/**
 * Concept: Vertex Degree in Undirected Graphs
 * Computes the degree of every junction (number of incident street ends).
 * Isolated junctions (degree 0) and parallel streets are explicitly accounted for.
 */
function getDegrees(graph) {
  const degrees = {};
  if (!graph || !graph.junctions) return degrees;

  for (const j of graph.junctions) {
    degrees[j.id] = 0;
  }

  if (graph.streets) {
    for (const s of graph.streets) {
      if (degrees[s.from] !== undefined) degrees[s.from] += 1;
      if (degrees[s.to] !== undefined) degrees[s.to] += 1;
    }
  }

  return degrees;
}

/**
 * Concept: Parity of Vertex Degrees
 * Identifies all junctions with an odd degree, preserving junction definition order.
 */
function getOddJunctions(graph) {
  const degrees = getDegrees(graph);
  const odd = [];
  if (!graph || !graph.junctions) return odd;

  for (const j of graph.junctions) {
    if (degrees[j.id] % 2 !== 0) {
      odd.push(j.id);
    }
  }
  return odd;
}

/**
 * Theorem: Euler's Handshaking Lemma
 * In any undirected graph, the sum of all vertex degrees equals twice the number of edges:
 *   sum(deg(v)) = 2 * |E|
 * A consequence is that the number of vertices with odd degree is always even.
 */
function checkHandshaking(graph) {
  const degrees = getDegrees(graph);
  let sumOfDegrees = 0;
  for (const id in degrees) {
    sumOfDegrees += degrees[id];
  }

  const streetCount = (graph && graph.streets) ? graph.streets.length : 0;
  const twiceStreets = streetCount * 2;
  const holds = sumOfDegrees === twiceStreets;

  return { sumOfDegrees, twiceStreets, holds };
}

/**
 * Concept: Graph Connectivity via Depth-First Search (DFS)
 * Checks whether all junctions with positive degree (incident streets) form a single connected component.
 * Isolated junctions with degree 0 are ignored. An empty street set is considered not connected.
 */
function isConnected(graph) {
  if (!graph || !graph.streets || graph.streets.length === 0) {
    return false;
  }

  const degrees = getDegrees(graph);
  const activeJunctions = Object.keys(degrees).filter(id => degrees[id] > 0);
  if (activeJunctions.length === 0) {
    return false;
  }

  const adj = {};
  for (const id of activeJunctions) {
    adj[id] = [];
  }
  for (const s of graph.streets) {
    if (adj[s.from] && adj[s.to]) {
      adj[s.from].push(s.to);
      adj[s.to].push(s.from);
    }
  }

  const visited = new Set();
  const start = activeJunctions[0];
  const stack = [start];
  visited.add(start);

  while (stack.length > 0) {
    const current = stack.pop();
    for (const neighbor of adj[current]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        stack.push(neighbor);
      }
    }
  }

  return activeJunctions.every(id => visited.has(id));
}

/**
 * Theorem: Euler's Theorem on Eulerian Graphs
 * Determines whether the graph has an Euler circuit (0 odd vertices), an Euler path (2 odd vertices),
 * or requires repeated edges (4+ odd vertices), following connectivity verification.
 */
function getVerdict(graph) {
  const oddJunctions = getOddJunctions(graph);
  const connected = isConnected(graph);
  const degrees = getDegrees(graph);
  const activeJunctions = (graph && graph.junctions)
    ? graph.junctions.map(j => j.id).filter(id => degrees[id] > 0)
    : [];

  const streetCount = (graph && graph.streets) ? graph.streets.length : 0;

  if (streetCount === 0) {
    return {
      type: "empty",
      oddJunctions,
      connected: false,
      startOptions: [],
      message: "Add at least one street to begin."
    };
  }

  if (!connected) {
    return {
      type: "not-connected",
      oddJunctions,
      connected: false,
      startOptions: [],
      message: "The streets are not all connected, so no single route can cover them."
    };
  }

  if (oddJunctions.length === 0) {
    return {
      type: "circuit",
      oddJunctions,
      connected: true,
      startOptions: activeJunctions,
      message: "Euler circuit exists. Every street can be covered exactly once and the truck returns to the start."
    };
  }

  if (oddJunctions.length === 2) {
    return {
      type: "path",
      oddJunctions,
      connected: true,
      startOptions: [oddJunctions[0], oddJunctions[1]],
      message: `Euler path exists. Start at ${oddJunctions[0]} and finish at ${oddJunctions[1]}.`
    };
  }

  return {
    type: "repeats",
    oddJunctions,
    connected: true,
    startOptions: activeJunctions,
    message: `${oddJunctions.length} odd junctions. Some streets must be repeated.`
  };
}

/**
 * Helper: Minimum Weight Edge Selection
 * Finds the street with the minimum length connecting two adjacent vertices.
 */
function cheapestStreetBetween(graph, u, v) {
  if (!graph || !graph.streets) return null;
  let cheapest = null;
  for (const s of graph.streets) {
    if ((s.from === u && s.to === v) || (s.from === v && s.to === u)) {
      if (!cheapest || s.length < cheapest.length) {
        cheapest = s;
      }
    }
  }
  return cheapest;
}

/**
 * Algorithm: Floyd-Warshall All-Pairs Shortest Paths
 * Computes shortest distances and reconstruction next-pointers between every pair of junctions using dynamic programming.
 */
function shortestPaths(graph) {
  const dist = {};
  const next = {};
  const junctions = (graph && graph.junctions) ? graph.junctions : [];

  for (const u of junctions) {
    dist[u.id] = {};
    next[u.id] = {};
    for (const v of junctions) {
      dist[u.id][v.id] = u.id === v.id ? 0 : Infinity;
      next[u.id][v.id] = null;
    }
  }

  if (graph && graph.streets) {
    for (const s of graph.streets) {
      if (dist[s.from] && dist[s.from][s.to] !== undefined) {
        if (s.length < dist[s.from][s.to]) {
          dist[s.from][s.to] = s.length;
          dist[s.to][s.from] = s.length;
          next[s.from][s.to] = s.to;
          next[s.to][s.from] = s.from;
        }
      }
    }
  }

  const ids = junctions.map(j => j.id);
  for (const k of ids) {
    for (const i of ids) {
      for (const j of ids) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
          next[i][j] = next[i][k];
        }
      }
    }
  }

  return { dist, next };
}

/**
 * Concept: Shortest Path Reconstruction
 * Traces the sequence of intermediate junctions from node 'a' to 'b' using the Floyd-Warshall 'next' matrix.
 */
function getPath(next, a, b) {
  if (a === b) return [a];
  if (!next || !next[a] || !next[a][b]) return [];

  const path = [a];
  let current = a;
  const visited = new Set([a]);

  while (current !== b) {
    current = next[current][b];
    if (!current || visited.has(current)) return [];
    visited.add(current);
    path.push(current);
  }
  return path;
}

/**
 * Combinatorics: Complete Matchings (Pairings)
 * For 2k odd junctions there are (2k-1)!! = 1 x 3 x 5 x ... x (2k-1) pairings.
 * Recursively pairs the first unpaired vertex with each candidate and branches.
 */
function generatePairings(items) {
  if (items.length === 0) return [[]];
  if (items.length % 2 !== 0) return [];

  const first = items[0];
  const rest = items.slice(1);
  const pairings = [];

  for (let i = 0; i < rest.length; i++) {
    const pair = [first, rest[i]];
    const remaining = rest.slice(0, i).concat(rest.slice(i + 1));
    const subPairings = generatePairings(remaining);
    for (const sub of subPairings) {
      pairings.push([pair, ...sub]);
    }
  }
  return pairings;
}

/**
 * Algorithm: Hierholzer's Algorithm for Eulerian Walks
 * Walk until stuck, then splice in loops from junctions that still have unused streets.
 * Operates on a multigraph edge list with unique edge identifiers.
 */
function eulerWalk(edges, start) {
  const adj = {};
  for (const e of edges) {
    if (!adj[e.from]) adj[e.from] = [];
    if (!adj[e.to]) adj[e.to] = [];
    adj[e.from].push({ edge: e, to: e.to });
    adj[e.to].push({ edge: e, to: e.from });
  }

  const used = new Set();
  const stack = [{ node: start, via: null, from: null }];
  const result = [];

  while (stack.length > 0) {
    const top = stack[stack.length - 1];
    const neighbors = adj[top.node] || [];
    let nextEdge = null;
    let nextNode = null;

    for (const item of neighbors) {
      if (!used.has(item.edge.uid)) {
        nextEdge = item.edge;
        nextNode = item.to;
        break;
      }
    }

    if (nextEdge) {
      used.add(nextEdge.uid);
      stack.push({ node: nextNode, via: nextEdge, from: top.node });
    } else {
      stack.pop();
      if (top.via !== null) {
        result.push({ from: top.from, to: top.node, edge: top.via });
      }
    }
  }

  result.reverse();

  // Sanity check: all edges visited and route contiguous
  if (result.length !== edges.length) {
    return { ok: false, error: "Eulerian walk could not traverse all streets." };
  }
  for (let i = 0; i < result.length - 1; i++) {
    if (result[i].to !== result[i + 1].from) {
      return { ok: false, error: "Discontinuous route detected." };
    }
  }

  return { ok: true, walk: result };
}

/**
 * Algorithm: Euler Path & Circuit Finder
 * Validates the Euler condition and invokes Hierholzer's walk to compute single-pass traversal.
 */
function findRoute(graph, start) {
  const verdict = getVerdict(graph);
  if (verdict.type !== "circuit" && verdict.type !== "path") {
    return {
      ok: false,
      error: "No Euler route exists. Use solvePostman for maps that need repeated streets."
    };
  }

  const chosenStart = start !== undefined ? start : verdict.startOptions[0];
  if (!verdict.startOptions.includes(chosenStart)) {
    return {
      ok: false,
      error: `Start junction not allowed. Choose one of: ${verdict.startOptions.join(", ")}`
    };
  }

  const edges = graph.streets.map((s, idx) => ({
    uid: `orig_${s.id}_${idx}`,
    from: s.from,
    to: s.to,
    length: s.length,
    streetId: s.id,
    isRepeat: false
  }));

  const walkResult = eulerWalk(edges, chosenStart);
  if (!walkResult.ok) {
    return { ok: false, error: walkResult.error };
  }

  let runningTotal = 0;
  const steps = walkResult.walk.map((step, idx) => {
    runningTotal += step.edge.length;
    return {
      index: idx + 1,
      from: step.from,
      to: step.to,
      streetId: step.edge.streetId,
      length: step.edge.length,
      isRepeat: false,
      runningTotal
    };
  });

  const route = [chosenStart, ...walkResult.walk.map(w => w.to)];
  const end = route[route.length - 1];

  return {
    ok: true,
    start: chosenStart,
    end,
    route,
    steps,
    totalDistance: runningTotal
  };
}

/**
 * Algorithm: Chinese Postman Problem (Edmonds & Johnson approach)
 * Pairs odd-degree vertices with minimum total distance, duplicates paths, and finds an Euler circuit.
 */
function solvePostman(graph, start) {
  const verdict = getVerdict(graph);

  if (verdict.type === "empty" || verdict.type === "not-connected") {
    return {
      ok: false,
      type: verdict.type,
      oddJunctions: verdict.oddJunctions,
      pairingsTried: 0,
      pairings: [],
      repeatedStreetIds: [],
      originalLength: 0,
      extraDistance: 0,
      totalDistance: 0,
      route: [],
      steps: [],
      error: verdict.message
    };
  }

  if (verdict.type === "circuit" || verdict.type === "path") {
    const res = findRoute(graph, start);
    if (!res.ok) {
      return {
        ok: false,
        type: verdict.type,
        oddJunctions: verdict.oddJunctions,
        pairingsTried: 0,
        pairings: [],
        repeatedStreetIds: [],
        originalLength: 0,
        extraDistance: 0,
        totalDistance: 0,
        route: [],
        steps: [],
        error: res.error
      };
    }
    return {
      ok: true,
      type: verdict.type,
      oddJunctions: verdict.oddJunctions,
      pairingsTried: 0,
      pairings: [],
      repeatedStreetIds: [],
      originalLength: res.totalDistance,
      extraDistance: 0,
      totalDistance: res.totalDistance,
      route: res.route,
      steps: res.steps,
      error: null
    };
  }

  // Case: verdict.type === "repeats"
  if (verdict.oddJunctions.length > 12) {
    return {
      ok: false,
      type: "repeats",
      oddJunctions: verdict.oddJunctions,
      pairingsTried: 0,
      pairings: [],
      repeatedStreetIds: [],
      originalLength: 0,
      extraDistance: 0,
      totalDistance: 0,
      route: [],
      steps: [],
      error: "Too many odd junctions (max 12)"
    };
  }

  const chosenStart = start !== undefined ? start : verdict.startOptions[0];
  if (!verdict.startOptions.includes(chosenStart)) {
    return {
      ok: false,
      type: "repeats",
      oddJunctions: verdict.oddJunctions,
      pairingsTried: 0,
      pairings: [],
      repeatedStreetIds: [],
      originalLength: 0,
      extraDistance: 0,
      totalDistance: 0,
      route: [],
      steps: [],
      error: `Start junction not allowed. Choose one of: ${verdict.startOptions.join(", ")}`
    };
  }

  const sp = shortestPaths(graph);
  const rawPairings = generatePairings(verdict.oddJunctions);

  const evaluatedPairings = rawPairings.map(pairing => {
    let cost = 0;
    for (const [u, v] of pairing) {
      cost += sp.dist[u][v];
    }
    return { pairs: pairing, cost };
  });

  evaluatedPairings.sort((a, b) => a.cost - b.cost);

  const pairings = evaluatedPairings.map((p, idx) => ({
    pairs: p.pairs,
    cost: p.cost,
    chosen: idx === 0
  }));

  const chosenPairing = pairings[0];
  const edges = graph.streets.map((s, idx) => ({
    uid: `orig_${s.id}_${idx}`,
    from: s.from,
    to: s.to,
    length: s.length,
    streetId: s.id,
    isRepeat: false
  }));

  let dupIndex = 0;
  const duplicateEdges = [];
  for (const [u, v] of chosenPairing.pairs) {
    const pathNodes = getPath(sp.next, u, v);
    for (let i = 0; i < pathNodes.length - 1; i++) {
      const n1 = pathNodes[i];
      const n2 = pathNodes[i + 1];
      const cheapest = cheapestStreetBetween(graph, n1, n2);
      const dupEdge = {
        uid: `dup_${cheapest.id}_${dupIndex++}`,
        from: n1,
        to: n2,
        length: cheapest.length,
        streetId: cheapest.id,
        isRepeat: true
      };
      duplicateEdges.push(dupEdge);
      edges.push(dupEdge);
    }
  }

  const walkResult = eulerWalk(edges, chosenStart);
  if (!walkResult.ok) {
    return { ok: false, error: walkResult.error };
  }

  let runningTotal = 0;
  const steps = walkResult.walk.map((step, idx) => {
    runningTotal += step.edge.length;
    return {
      index: idx + 1,
      from: step.from,
      to: step.to,
      streetId: step.edge.streetId,
      length: step.edge.length,
      isRepeat: step.edge.isRepeat,
      runningTotal
    };
  });

  const originalLength = graph.streets.reduce((sum, s) => sum + s.length, 0);
  const extraDistance = chosenPairing.cost;
  const totalDistance = originalLength + extraDistance;
  const route = [chosenStart, ...walkResult.walk.map(w => w.to)];
  const repeatedStreetIds = Array.from(new Set(duplicateEdges.map(e => e.streetId)));

  return {
    ok: true,
    type: "repeats",
    oddJunctions: verdict.oddJunctions,
    pairingsTried: rawPairings.length,
    pairings,
    repeatedStreetIds,
    originalLength,
    extraDistance,
    totalDistance,
    route,
    steps,
    error: null
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    getDegrees,
    getOddJunctions,
    checkHandshaking,
    isConnected,
    getVerdict,
    cheapestStreetBetween,
    shortestPaths,
    getPath,
    generatePairings,
    eulerWalk,
    findRoute,
    solvePostman
  };
}
