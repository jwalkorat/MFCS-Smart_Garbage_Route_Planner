# RouteWise API & Data Contract

This document defines the shared data schemas, core graph algorithms contract, and standard practice map dataset for RouteWise.

---

## 1. Data Formats

### Graph Structure
The colony street network is modeled as an undirected, weighted graph:

```json
{
  "nodes": [
    { "id": "A", "label": "Junction A", "x": 100, "y": 150 }
  ],
  "edges": [
    { "id": "e1", "u": "A", "v": "B", "weight": 120, "name": "Main Street" }
  ]
}
```

- **Node / Junction:**
  - `id` (`string`): Unique identifier for the junction (e.g., `"A"`, `"B"`).
  - `label` (`string`): Human-readable name.
  - `x`, `y` (`number`): Coordinates for 2D map visualization.

- **Edge / Street:**
  - `id` (`string`): Unique edge identifier.
  - `u` (`string`): First endpoint node ID.
  - `v` (`string`): Second endpoint node ID.
  - `weight` (`number`): Length / travel cost of the street in meters.
  - `name` (`string`): Street name.

---

## 2. Core Logic Functions (`logic.js`)

Each algorithm function operates on the graph data format defined above:

### `getDegrees(graph)`
- **Input:** `graph` object `{ nodes, edges }`
- **Output:** `Object.<string, number>` map of node ID to degree count.
- **Example:** `{ "A": 3, "B": 2, "C": 4 }`

### `getOddJunctions(graph)`
- **Input:** `graph` object `{ nodes, edges }`
- **Output:** `string[]` array of node IDs with an odd degree.
- **Example:** `["A", "D"]`

### `isConnected(graph)`
- **Input:** `graph` object `{ nodes, edges }`
- **Output:** `boolean` — `true` if all nodes with degree > 0 belong to a single connected component.

### `getVerdict(graph)`
- **Input:** `graph` object `{ nodes, edges }`
- **Output:**
  ```javascript
  {
    isEulerian: boolean,        // true if all vertices have even degree and connected
    isSemiEulerian: boolean,    // true if exactly 2 vertices have odd degree and connected
    oddCount: number,           // count of odd vertices
    oddNodes: string[],         // list of odd vertices
    message: string             // human-readable summary verdict
  }
  ```

### `findRoute(graph, startNode)`
- **Input:** `graph`, `startNode` (`string`)
- **Output:** `string[]` sequence of node visits for an exact Eulerian circuit/trail (if Eulerian or semi-Eulerian), or `null` if not traversable without re-traversing edges.

### `solvePostman(graph, startNode)`
- **Input:** `graph`, `startNode` (`string`)
- **Output:**
  ```javascript
  {
    route: string[],            // complete sequence of visited node IDs starting and ending at startNode
    totalDistance: number,      // total distance covered including duplicates
    duplicatedEdges: Array<{ u: string, v: string, weight: number }>, // streets repeated
    originalDistance: number    // sum of all street lengths
  }
  ```

---

## 3. Practice Map: Sample Colony Network

A practice colony graph with 6 junctions and 8 streets to test Euler Circuit and Chinese Postman Problem (CPP):

```javascript
const practiceMap = {
  nodes: [
    { id: "A", label: "Sector 1 Gate", x: 100, y: 120 },
    { id: "B", label: "Central Market", x: 300, y: 100 },
    { id: "C", label: "School Square", x: 500, y: 140 },
    { id: "D", label: "Park Circle", x: 120, y: 340 },
    { id: "E", label: "Civic Centre", x: 320, y: 320 },
    { id: "F", label: "Depot / Gate 2", x: 520, y: 350 }
  ],
  edges: [
    { id: "e1", u: "A", v: "B", weight: 200, name: "North Avenue" },
    { id: "e2", u: "B", v: "C", weight: 250, name: "Market Road" },
    { id: "e3", u: "A", v: "D", weight: 300, name: "West Ring Road" },
    { id: "e4", u: "B", v: "E", weight: 180, name: "Central Cross St" },
    { id: "e5", u: "C", v: "F", weight: 280, name: "East Ring Road" },
    { id: "e6", u: "D", v: "E", weight: 220, name: "Southwest Link" },
    { id: "e7", u: "E", v: "F", weight: 240, name: "Southeast Link" },
    { id: "e8", u: "B", v: "D", weight: 350, name: "Diagonal Crossway" }
  ]
};
```
