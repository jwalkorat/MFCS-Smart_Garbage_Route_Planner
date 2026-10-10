/**
 * presets.js - Standard Test Maps for RouteWise
 * Section 7 of Master Project Brief
 */

const PRESETS = [
  {
    name: "Practice (hand-calculation)",
    description: "4 odd junctions (A, B, C, D). Expected total: 24 (21 original + 3 extra)",
    graph: {
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
    }
  },
  {
    name: "Circuit (all even)",
    description: "All even vertices (degree 2). Euler circuit exists. Expected total: 400",
    graph: {
      junctions: [
        { id: "A", x: 250, y: 150 },
        { id: "B", x: 650, y: 150 },
        { id: "C", x: 650, y: 450 },
        { id: "D", x: 250, y: 450 }
      ],
      streets: [
        { id: 1, from: "A", to: "B", length: 100 },
        { id: 2, from: "B", to: "C", length: 100 },
        { id: 3, from: "C", to: "D", length: 100 },
        { id: 4, from: "D", to: "A", length: 100 }
      ]
    }
  },
  {
    name: "Path (two odd junctions)",
    description: "Two odd vertices (A, C). Euler path exists from A to C. Expected total: 20",
    graph: {
      junctions: [
        { id: "A", x: 200, y: 300 },
        { id: "B", x: 400, y: 120 },
        { id: "C", x: 600, y: 300 },
        { id: "D", x: 400, y: 480 }
      ],
      streets: [
        { id: 1, from: "A", to: "B", length: 2 },
        { id: 2, from: "B", to: "C", length: 3 },
        { id: 3, from: "C", to: "D", length: 4 },
        { id: 4, from: "D", to: "A", length: 5 },
        { id: 5, from: "A", to: "C", length: 6 }
      ]
    }
  },
  {
    name: "Society roads (needs repeats)",
    description: "4 odd vertices (B, C, E, F). Best pairing {BC, EF}=150. Expected total: 910",
    graph: {
      junctions: [
        { id: "A", x: 150, y: 300 },
        { id: "B", x: 330, y: 130 },
        { id: "C", x: 570, y: 130 },
        { id: "D", x: 750, y: 300 },
        { id: "E", x: 570, y: 470 },
        { id: "F", x: 330, y: 470 }
      ],
      streets: [
        { id: 1, from: "A", to: "B", length: 100 },
        { id: 2, from: "B", to: "C", length: 80 },
        { id: 3, from: "C", to: "D", length: 120 },
        { id: 4, from: "D", to: "E", length: 90 },
        { id: 5, from: "E", to: "F", length: 70 },
        { id: 6, from: "F", to: "A", length: 110 },
        { id: 7, from: "B", to: "E", length: 60 },
        { id: 8, from: "C", to: "F", length: 130 }
      ]
    }
  },
  {
    name: "Disconnected",
    description: "Two disconnected components (AB and CD). No single route possible.",
    graph: {
      junctions: [
        { id: "A", x: 200, y: 200 },
        { id: "B", x: 350, y: 200 },
        { id: "C", x: 550, y: 400 },
        { id: "D", x: 700, y: 400 }
      ],
      streets: [
        { id: 1, from: "A", to: "B", length: 50 },
        { id: 2, from: "C", to: "D", length: 60 }
      ]
    }
  }
];

// Node.js export for tests
if (typeof module !== "undefined" && module.exports) {
  module.exports = PRESETS;
}
