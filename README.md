# RouteWise: Smart Garbage Collection Route Planner

Plans an optimal route that covers every street of a colony using **Euler circuits** and the **Chinese Postman Problem (CPP)**, with interactive drawing over a real street map (OpenStreetMap + Leaflet) and full step-by-step mathematical working.

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

## 2. Real Map Integration

- **Street Map Underlay:** Uses **Leaflet 1.9.4** and **OpenStreetMap** tiles (`© OpenStreetMap contributors`), centered on Ahmedabad by default, with a synchronized SVG graph overlay.
- **Place Search:** Uses **OpenStreetMap Nominatim** (`https://nominatim.openstreetmap.org/search`) for lightweight place lookup (e.g., *"Nirma University"*).
- **Offline & Plain Grid Fallback:** An internet connection is needed for map tiles and place search. Users can switch between **Street map** and **Plain grid** at any time, and the plain dotted grid works completely offline.
- **Haversine Street Lengths:** When drawing a street between two junctions on the map, the default length is the straight-line spherical distance in metres calculated with the **haversine formula** ($R = 6{,}371{,}000\text{ m}$), not curved road distance. Users can accept or type a custom length.

---

## 3. How to Run Locally

No build step or installation is required:
1. Open `index.html` or `planner.html` directly in any modern browser, **or**
2. Serve the folder with any static server:
   ```bash
   npx serve .
   ```

## 4. How to Run the Tests

Run the automated test suite with Node.js (uses only the built-in `assert` module):
```bash
node tests/logic.test.js
```

---

## 5. Sample Input and Output (Practice Map)

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

## 6. Screenshots

- `[Screenshot Placeholder 1: Landing Page (index.html) – Problem, Model & KaTeX Maths]`
- `[Screenshot Placeholder 2: Interactive Planner (planner.html) – Real Street Map (OpenStreetMap) with Synced Colony Graph & Route]`
- `[Screenshot Placeholder 3: Interactive Planner (planner.html) – Plain Grid Mode, Chinese Postman Pairing Table & Step Animation]`

---

## 7. Folder Structure

```text
MFCS-Smart_Garbage_Route_Planner/
├── README.md           # Project overview, maths summary, and instructions
├── CONTRACT.md         # Shared graph data schema and function specifications
├── index.html          # Landing page (problem, model, KaTeX maths, worked example)
├── planner.html        # Interactive planner page (Leaflet real map + SVG overlay)
├── style.css           # Shared design system tokens and landing page styles
├── planner.css         # Planner toolbar, map stage, overlay, and panel styles
├── logic.js            # Pure discrete maths engine (Euler, DFS, Floyd-Warshall, CPP)
├── presets.js          # Five benchmark maps (Practice, Circuit, Path, Society, Disconnected)
├── planner.js          # Map interactions, Leaflet sync, haversine distance, live analysis
├── route-view.js       # Route rendering, Chinese Postman table, and step-by-step animation
└── tests/
    └── logic.test.js   # Node.js unit and property test suite
```

---

## 8. Limitations & Assumptions

- Streets are modeled as two-way (undirected edges).
- Default street lengths are straight-line distances measured on the map with the haversine formula, unless entered manually.
- The Chinese Postman solver evaluates all $(2k-1)!!$ pairings of odd junctions and supports up to **12 odd junctions** (10,395 pairings).

---

## 9. AI Assistance Statement

AI coding assistants (Antigravity / Claude) were used to help scaffold the HTML/CSS layout, integrate the Leaflet/SVG coordinate synchronization, and structure the unit test harness. All discrete mathematics algorithms in `logic.js` (degree counting, Handshaking verification, DFS connectivity, Floyd-Warshall shortest paths, recursive odd-vertex matching, and Hierholzer's Euler tour construction) and UI integrations were reviewed, tested, and verified by the team (`25BAM053`, `25BAM076`).
