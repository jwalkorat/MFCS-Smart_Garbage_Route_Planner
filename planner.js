/**
 * planner.js - Planner UI Controller & Map Interaction
 *
 * Responsibilities:
 * 1. Render the interactive street network graph (canvas / SVG).
 * 2. Handle user interactions (selecting start depot, clicking junctions/streets, toggling demo presets).
 * 3. Invoke routing algorithms from logic.js (getVerdict, findRoute, solvePostman).
 * 4. Update the analysis panel cards (Verdict, Degrees, Route step-by-step summary & metrics).
 * 5. Animate vehicle route traversal along the calculated path.
 */
