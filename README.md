# RouteWise: Smart Garbage Collection Route Planner

Plans an optimal route that covers every street of a colony using **Euler circuits** and the **Chinese Postman Problem (CPP)**, with interactive drawing on a plain grid and full step-by-step mathematical working.

**Course:** Mathematical Foundations for Computer Science (`2CS802CC26`), Nirma University<br>
**Team:** 25BAM053, 25BAM076<br>
**Live demo:** &lt;Vercel link, added after deployment&gt;

---

## 1. The Maths Used

- **Graph Model:** Colony junctions are modeled as vertices ($V$), streets as undirected edges ($E$), and street lengths in metres as positive edge weights ($w(e)$).
- **Vertex Degree:** $\deg(v)$ counts how many street ends meet at junction $v$.
- **Handshaking Theorem:** $\sum_{v \in V} \deg(v) = 2|E|$. Because every street has two endpoints, the sum of all degrees is always even, so the number of odd-degree junctions is always even.
- **Connectivity (DFS):** Depth-First Search checks that all active junctions ($\deg(v) > 0$) belong to a single connected component.
- **Euler's Theorem:**
  - **0 odd junctions:** An **Euler circuit** exists (covers every street once and returns to the start).
  - **2 odd junctions:** An **Euler path** exists (starts at one odd junction and ends at the other).
  - **4 or more odd junctions:** No single pass is possible without repeating streets.
- **Chinese Postman Problem (CPP):**
  1. Find all odd-degree junctions.
  2. Compute all-pairs shortest paths using the **Floyd-Warshall** algorithm.
  3. Evaluate all $(2k-1)!!$ complete pairings of the $2k$ odd junctions and pick the pairing with minimum total extra distance.
  4. Duplicate the streets along the shortest paths of the chosen pairs so every vertex has even degree.
  5. Construct the optimal Euler circuit using **Hierholzer's algorithm**.

---

## 2. How to Run Locally

Open `index.html` in a browser, or run `npx serve .` in the repository root.

## 3. How to Run the Tests

Run the automated test suite with Node.js (uses only the built-in `assert` module):
```bash
node tests/logic.test.js
```

---

## 4. Sample Input and Output (Practice Map)

- **Junctions:** `A`, `B`, `C`, `D`
- **Streets:** `AB = 2`, `AC = 3`, `AD = 4`, `BC = 6`, `BD = 5`, `CD = 1` (Original street length = `21 m`)
- **Degrees:** `A = 3, B = 3, C = 3, D = 3` (Handshaking: $12 = 2 \times 6$)
- **Odd Junctions:** `A, B, C, D` (4 odd junctions &rarr; Verdict: `repeats`)
- **Odd Pairings Evaluated:**
  - `{A-B, C-D}`: cost $2 + 1 = \mathbf{3\text{ m}}$ (**Best / Chosen**)
  - `{A-C, B-D}`: cost $3 + 5 = 8\text{ m}$
  - `{A-D, B-C}`: cost $4 + 5 = 9\text{ m}$ (where shortest path B&ndash;C is $2+3=5$ via A)
- **Optimal Route Total:** `21 m (original) + 3 m (repeats) = 24 m` across 8 traversal steps.

---

## 5. Screenshots

- `[Screenshot Placeholder 1: Landing Page (index.html) – Problem, Model & KaTeX Maths]`
- `[Screenshot Placeholder 2: Interactive Planner (planner.html) – Colony Graph, Euler Verdict & Degrees Table]`
- `[Screenshot Placeholder 3: Interactive Planner (planner.html) – Chinese Postman Pairing Table & Step Animation]`

---

## 6. Folder Structure

```text
MFCS-Smart_Garbage_Route_Planner/
├── README.md           # Project overview, maths summary, and instructions
├── CONTRACT.md         # Shared graph data schema and function specifications
├── index.html          # Landing page (problem, model, KaTeX maths, worked example)
├── planner.html        # Interactive planner page (SVG dotted-grid canvas + analysis panels)
├── style.css           # Shared design system tokens and landing page styles
├── planner.css         # Planner toolbar, SVG canvas, and panel styles
├── logic.js            # Pure discrete maths engine (Euler, DFS, Floyd-Warshall, CPP)
├── presets.js          # Five benchmark maps (Practice, Circuit, Path, Society, Disconnected)
├── planner.js          # Map interactions, toolbar tools, and live degree/verdict analysis
├── route-view.js       # Route rendering, Chinese Postman table, and step-by-step animation
└── tests/
    └── logic.test.js   # Node.js unit and property test suite
```

---

## 7. Limitations & Assumptions

- Lengths are entered by the user, and default to the on-screen distance between junctions.
- Streets are modeled as two-way (undirected edges).
- The Chinese Postman solver evaluates all $(2k-1)!!$ pairings of odd junctions and supports up to **12 odd junctions** (10,395 pairings).

---

## 8. AI Assistance Statement

AI coding assistants (Antigravity / Claude) were used to help scaffold the HTML/CSS layout and structure the unit test harness. All discrete mathematics algorithms in `logic.js` (degree counting, Handshaking verification, DFS connectivity, Floyd-Warshall shortest paths, recursive odd-vertex matching, and Hierholzer's Euler tour construction) and UI integrations were reviewed, tested, and verified by the team (`25BAM053`, `25BAM076`).
