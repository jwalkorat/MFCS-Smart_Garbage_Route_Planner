/**
 * RouteWise - Core Graph Theory & Routing Logic
 * Course: Mathematical Foundations for Computer Science (2CS802CC26)
 * Team: 25BAM053, 25BAM076
 *
 * Pure discrete mathematics: Euler's theorems, Floyd-Warshall, and Chinese Postman algorithms.
 */

/**
 * Concept: Vertex Degree in Undirected Graphs
 * Computes the degree of every junction (number of incident street ends).
 * deg(v) = number of streets meeting at junction v.
 * Every junction ID appears, including those with degree 0.
 * Parallel streets count separately.
 *
 * @param {Object} graph - { junctions: Array<{id, x, y}>, streets: Array<{id, from, to, length}> }
 * @returns {Object.<string, number>} Map of junction ID to degree count.
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
 * Identifies all junctions with an odd degree.
 * Handshaking lemma implies the number of odd-degree vertices is always even.
 *
 * @param {Object} graph - { junctions, streets }
 * @returns {string[]} Odd-degree junction IDs in definition order.
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
 * Theorem: Euler's Handshaking Theorem
 * In any undirected graph, the sum of all vertex degrees equals twice the number of edges:
 *   sum(deg(v)) = 2 * |E|
 * Every street is counted once at each of its two endpoints.
 *
 * @param {Object} graph - { junctions, streets }
 * @returns {{ sumOfDegrees: number, twiceStreets: number, holds: boolean }}
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
 * Checks whether all junctions with positive degree (incident streets) belong to a single connected component.
 * Isolated junctions (degree 0) are ignored. Graph with no streets returns false.
 *
 * @param {Object} graph - { junctions, streets }
 * @returns {boolean} True if all non-isolated junctions are connected.
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

  // Build adjacency list for DFS traversal
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
 * Classifies the graph into Eulerian categories and describes traversal feasibility:
 * - 0 odd: Euler circuit (start & end at same junction)
 * - 2 odd: Euler path (start at one odd junction, end at the other)
 * - 4+ odd: Chinese Postman Problem (streets must be repeated)
 *
 * @param {Object} graph - { junctions, streets }
 * @returns {{ type: string, oddJunctions: string[], connected: boolean, startOptions: string[], message: string }}
 *   type: "empty" | "not-connected" | "circuit" | "path" | "repeats"
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
 * Computes shortest distances and reconstruction next-pointers between every pair of junctions using dynamic programming:
 *   d[i][j] = min(d[i][j], d[i][k] + d[k][j])
 *
 * @param {Object} graph - { junctions, streets }
 * @returns {{ dist: Object.<string, Object.<string, number>>, next: Object.<string, Object.<string, string>> }}
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
 *
 * @param {Object} next - Table mapping [u][v] to the next intermediate junction ID.
 * @param {string} a - Starting junction ID.
 * @param {string} b - Target junction ID.
 * @returns {string[]} List of junction IDs along the shortest path from a to b.
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
 * Finds an exact Euler path or circuit covering each street exactly once.
 * (Placeholder for Commit 2)
 */
function findRoute(graph, start) {
  return { ok: false };
}

/**
 * Solves the Chinese Postman Problem (CPP).
 * (Placeholder for Commit 2)
 */
function solvePostman(graph, start) {
  return { ok: false };
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
    findRoute,
    solvePostman
  };
}
