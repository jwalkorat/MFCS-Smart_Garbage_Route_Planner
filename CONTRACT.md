# RouteWise API & Data Contract

This document defines the shared data schemas, function signatures, and standard practice map dataset for RouteWise according to the Master Project Brief.

---

## 1. Graph Data Model

The street network is modeled as an undirected, weighted graph:

```javascript
const graph = {
  junctions: [
    { id: "A", x: 200, y: 150 },
    { id: "B", x: 650, y: 150 },
    { id: "C", x: 650, y: 450 },
    { id: "D", x: 200, y: 450 }
  ],
  streets: [
    { id: 1, from: "A", to: "B", length: 2 },
    { id: 2, from: "A", to: "C", length: 3 },
    { id: 3, from: "A", to: "D", length: 4 },
    { id: 4, from: "B", to: "C", length: 6 },
    { id: 5, from: "B", to: "D", length: 5 },
    { id: 6, from: "C", to: "D", length: 1 }
  ]
};
```

- **Junctions:**
  - `id` (`string`): "A", "B", ... "Z", "A1", etc.
  - `x`, `y` (`number`): SVG canvas coordinates (`viewBox="0 0 900 600"`).
  - `lat`, `lng` (`number`, optional): Geographic coordinates in decimal degrees when placed on the real street map. The maths in `logic.js` ignores these fields.
- **Streets:**
  - `id` (`number`): Unique integer.
  - `from` (`string`), `to` (`string`): Connected junction IDs.
  - `length` (`number`): Positive number (metres in UI).
- **Step Object** (traversal steps):
```javascript
{
  index: 1,
  from: "A",
  to: "B",
  streetId: 1,
  length: 2,
  isRepeat: false,
  runningTotal: 2
}
```

---

## 2. Core Logic Functions (`logic.js`)

All 8 functions + helper operates on the graph model:

### 1. `getDegrees(graph)`
- **Returns:** `{ [junctionId]: number }` (e.g., `{ A: 3, B: 3, C: 3, D: 3 }`). Every junction ID appears, including degree 0.

### 2. `getOddJunctions(graph)`
- **Returns:** `string[]` (e.g., `["A", "B", "C", "D"]`). Sorted alphabetically.

### 3. `checkHandshaking(graph)`
- **Returns:** `{ sumOfDegrees: number, twiceStreets: number, holds: boolean }`.
- `holds` must always be `true` ($\sum \deg(v) = 2 \times |E|$).

### 4. `isConnected(graph)`
- **Returns:** `boolean`. Checks reachability across all junctions with degree > 0. Graph with no streets returns `false`.

### 5. `getVerdict(graph)`
- **Returns:**
  ```javascript
  {
    type: "circuit" | "path" | "repeats" | "not-connected" | "empty",
    oddJunctions: string[],
    connected: boolean,
    startOptions: string[], // all active junctions for circuit, the two odd junctions for path, empty otherwise
    message: string         // friendly UI summary sentence
  }
  ```

### 6. `shortestPaths(graph)` & `getPath(next, a, b)`
- **`shortestPaths(graph)` Returns:** `{ dist, next }` using Floyd-Warshall.
- **`getPath(next, a, b)` Returns:** `string[]` of junction IDs along the shortest path from `a` to `b`.

### 7. `findRoute(graph, start)`
- Only for verdict `circuit` or `path`. For path, `start` must be an odd junction.
- **Returns:**
  ```javascript
  {
    ok: boolean,
    start: string | null,
    end: string | null,
    route: string[],
    steps: Array<Step>,
    totalDistance: number,
    error: string | null
  }
  ```

### 8. `solvePostman(graph)`
- Handles every verdict (circuit, path, repeats, not-connected, empty).
- **Returns:**
  ```javascript
  {
    ok: boolean,
    type: "circuit" | "path" | "repeats" | "not-connected" | "empty",
    oddJunctions: string[],
    pairingsTried: number,
    pairings: [
      { pairs: [["A", "B"], ["C", "D"]], cost: 3, chosen: true }
    ],
    repeatedStreetIds: number[],
    originalLength: number,
    extraDistance: number,
    totalDistance: number,
    route: string[],
    steps: Array<Step>,
    error: string | null
  }
  ```

---

## 3. Practice Map (Section 7 Map 1: Hand-calculation)

```javascript
const practiceMap = {
  junctions: [
    { id: "A", x: 200, y: 150 },
    { id: "B", x: 650, y: 150 },
    { id: "C", x: 650, y: 450 },
    { id: "D", x: 200, y: 450 }
  ],
  streets: [
    { id: 1, from: "A", to: "B", length: 2 },
    { id: 2, from: "A", to: "C", length: 3 },
    { id: 3, from: "A", to: "D", length: 4 },
    { id: 4, from: "B", to: "C", length: 6 },
    { id: 5, from: "B", to: "D", length: 5 },
    { id: 6, from: "C", to: "D", length: 1 }
  ]
};
```

- **Degrees:** A=3, B=3, C=3, D=3. Handshaking: $12 = 2 \times 6$.
- **Odd junctions:** A, B, C, D. Verdict: `repeats`.
- **Shortest distances:** AB=2, AC=3, AD=4, BC=5 (via A), BD=5, CD=1.
- **Pairings:**
  - {AB, CD} = $2 + 1 = 3$ (**best / chosen**)
  - {AC, BD} = $3 + 5 = 8$
  - {AD, BC} = $4 + 5 = 9$
- **Original Length:** 21. **Extra Distance:** 3. **Expected Total:** 24.