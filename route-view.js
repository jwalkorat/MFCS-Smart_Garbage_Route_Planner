// RouteWise - Route View & Visualization Integration
// Mathematical Foundations for Computer Science (2CS802CC26), Nirma University
// Connects discrete maths route logic (findRoute, solvePostman) to the SVG planner.

(function () {
  "use strict";

  const cardRoute = document.getElementById("card-route");
  if (!cardRoute) return;

  // Initialize Card Route DOM structure as specified in Section 8
  cardRoute.innerHTML = `
    <div class="analysis-header">
      <h3 class="analysis-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
        Route Planner
      </h3>
    </div>

    <div class="route-controls">
      <div class="route-select-group">
        <label for="start-select">Starting Junction:</label>
        <select id="start-select" class="route-select"></select>
      </div>

      <button id="btn-find-route" class="btn btn-primary" type="button" style="width: 100%;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Find route
      </button>
    </div>

    <!-- Postman summary card for repeated streets -->
    <div id="postman-card" class="card" hidden style="margin-bottom: 1rem; padding: 0.85rem; background: #FFFBEB; border-color: #FDE68A;">
      <h4 style="font-size: 0.85rem; font-weight: 700; color: #92400E; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.35rem;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
        Odd Junction Pairings (Floyd-Warshall Matching)
      </h4>
      <div style="overflow-x: auto;">
        <table class="postman-table">
          <thead>
            <tr>
              <th>Pairing</th>
              <th>Extra Cost</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="postman-table-body"></tbody>
        </table>
      </div>
      <p id="postman-extra-distance" style="font-size: 0.825rem; font-weight: 600; color: #B45309; margin-top: 0.4rem;"></p>
    </div>

    <!-- Ordered Step List -->
    <div id="route-steps-container" style="display: none; margin-bottom: 0.75rem;">
      <h4 style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.4rem;">Traversal Steps:</h4>
      <ol id="route-steps" class="steps-list"></ol>
    </div>

    <!-- Totals display -->
    <p id="route-totals" class="route-totals-box" style="display: none;"></p>
  `;

  const startSelect = document.getElementById("start-select");
  const btnFindRoute = document.getElementById("btn-find-route");
  const postmanCard = document.getElementById("postman-card");
  const postmanTableBody = document.getElementById("postman-table-body");
  const postmanExtraDistance = document.getElementById("postman-extra-distance");
  const routeStepsContainer = document.getElementById("route-steps-container");
  const routeSteps = document.getElementById("route-steps");
  const routeTotals = document.getElementById("route-totals");

  /**
   * Resets all route outputs when the map geometry or tools change.
   */
  function clearRouteDisplay() {
    const routeLayer = document.getElementById("route-layer");
    if (routeLayer) routeLayer.innerHTML = "";

    if (routeSteps) routeSteps.innerHTML = "";
    if (routeStepsContainer) routeStepsContainer.style.display = "none";
    if (routeTotals) {
      routeTotals.textContent = "";
      routeTotals.style.display = "none";
    }
    if (postmanCard) postmanCard.hidden = true;
    if (postmanTableBody) postmanTableBody.innerHTML = "";
    if (postmanExtraDistance) postmanExtraDistance.textContent = "";
  }

  /**
   * Updates start options dropdown and button enabled status.
   */
  function updateRouteControls(graph) {
    clearRouteDisplay();

    if (!window.RouteWise || typeof getVerdict !== "function") return;
    const verdict = getVerdict(graph);

    startSelect.innerHTML = "";

    if (verdict.type === "empty" || verdict.type === "not-connected") {
      btnFindRoute.disabled = true;
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = verdict.type === "empty" ? "Add streets first" : "Disconnected graph";
      startSelect.appendChild(opt);
    } else {
      btnFindRoute.disabled = false;
      verdict.startOptions.forEach((nodeId) => {
        const opt = document.createElement("option");
        opt.value = nodeId;
        opt.textContent = `Junction ${nodeId}`;
        startSelect.appendChild(opt);
      });
    }
  }

  /**
   * Formats a pairing array [["A", "B"], ["C", "D"]] as "A-B, C-D".
   */
  function formatPairingString(pairs) {
    return pairs.map(p => `${p[0]}-${p[1]}`).join(", ");
  }

  /**
   * Computes perpendicular unit vector offset for repeated street lines.
   */
  function computePerpendicularOffset(x1, y1, x2, y2, offsetDistance) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len === 0) return { ox: 0, oy: 0 };
    return {
      ox: -offsetDistance * (dy / len),
      oy: offsetDistance * (dx / len)
    };
  }

  /**
   * Draws route lines and step badges on the SVG #route-layer.
   */
  function drawRouteOnMap(graph, steps) {
    const routeLayer = document.getElementById("route-layer");
    if (!routeLayer) return;
    routeLayer.innerHTML = "";

    const jMap = new Map(graph.junctions.map(j => [j.id, j]));
    const repeatedStreetStepCounts = new Map();

    steps.forEach((step) => {
      const fromJ = jMap.get(step.from);
      const toJ = jMap.get(step.to);
      if (!fromJ || !toJ) return;

      let ox = 0;
      let oy = 0;

      if (step.isRepeat) {
        // Shift 6px sideways perpendicular to the line so original street remains visible
        const offset = computePerpendicularOffset(fromJ.x, fromJ.y, toJ.x, toJ.y, 6);
        ox = offset.ox;
        oy = offset.oy;
      }

      // 1. Route Line
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", fromJ.x + ox);
      line.setAttribute("y1", fromJ.y + oy);
      line.setAttribute("x2", toJ.x + ox);
      line.setAttribute("y2", toJ.y + oy);
      line.setAttribute("class", "route-step");
      line.setAttribute("data-step-index", step.index);

      if (step.isRepeat) {
        line.setAttribute("stroke", "var(--orange)");
        line.setAttribute("stroke-width", "4");
        line.setAttribute("stroke-linecap", "round");
        line.setAttribute("stroke-dasharray", "8 6");
      } else {
        line.setAttribute("stroke", "var(--blue)");
        line.setAttribute("stroke-width", "5");
        line.setAttribute("stroke-linecap", "round");
      }

      routeLayer.appendChild(line);

      // 2. Midpoint Numbered Circle Badge
      const midX = (fromJ.x + toJ.x) / 2 + ox;
      const midY = (fromJ.y + toJ.y) / 2 + oy;

      const badgeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      badgeGroup.setAttribute("class", "route-badge");
      badgeGroup.setAttribute("data-step-index", step.index);

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", midX);
      circle.setAttribute("cy", midY);
      circle.setAttribute("r", "9");
      circle.setAttribute("fill", step.isRepeat ? "var(--orange)" : "var(--blue)");
      circle.setAttribute("stroke", "#FFFFFF");
      circle.setAttribute("stroke-width", "1.5");

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", midX);
      text.setAttribute("y", midY);
      text.setAttribute("fill", "#FFFFFF");
      text.setAttribute("font-size", "9");
      text.setAttribute("font-weight", "700");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "central");
      text.textContent = String(step.index);

      badgeGroup.appendChild(circle);
      badgeGroup.appendChild(text);
      routeLayer.appendChild(badgeGroup);

      // 3. "x2" label for repeated streets (draw once per repeated street)
      if (step.isRepeat && !repeatedStreetStepCounts.has(step.streetId)) {
        repeatedStreetStepCounts.set(step.streetId, true);
        const x2Label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        x2Label.setAttribute("x", midX + ox * 1.5);
        x2Label.setAttribute("y", midY + oy * 1.5 - 12);
        x2Label.setAttribute("class", "route-x2-label");
        x2Label.setAttribute("fill", "var(--orange)");
        x2Label.setAttribute("font-size", "11");
        x2Label.setAttribute("font-weight", "800");
        x2Label.setAttribute("text-anchor", "middle");
        x2Label.textContent = "x2";
        routeLayer.appendChild(x2Label);
      }
    });
  }

  /**
   * Handles the Find Route action.
   */
  function handleFindRoute() {
    if (!window.RouteWise) return;
    const graph = window.RouteWise.getGraph();
    const verdict = getVerdict(graph);

    if (verdict.type === "empty" || verdict.type === "not-connected") {
      window.RouteWise.showToast(verdict.message);
      return;
    }

    const startNode = startSelect.value || verdict.startOptions[0];
    let result = null;

    if (verdict.type === "circuit" || verdict.type === "path") {
      result = findRoute(graph, startNode);
    } else if (verdict.type === "repeats") {
      result = solvePostman(graph, startNode);
    }

    if (!result || !result.ok) {
      const errMsg = (result && result.error) ? result.error : "Failed to find route.";
      window.RouteWise.showToast(errMsg);
      return;
    }

    // 1. Postman Card (only for repeats)
    if (result.type === "repeats" && result.pairings && result.pairings.length > 0) {
      postmanTableBody.innerHTML = "";
      result.pairings.forEach((p) => {
        const tr = document.createElement("tr");
        if (p.chosen) tr.className = "postman-row-chosen";

        const bestBadge = p.chosen ? `<span class="best-badge">Best</span>` : "";
        tr.innerHTML = `
          <td><strong>${formatPairingString(p.pairs)}</strong></td>
          <td>${p.cost} m</td>
          <td>${p.chosen ? bestBadge : "<span style='color:var(--text-muted);'>Candidate</span>"}</td>
        `;
        postmanTableBody.appendChild(tr);
      });

      postmanExtraDistance.textContent = `Extra distance = ${result.extraDistance}`;
      postmanCard.hidden = false;
    } else {
      postmanCard.hidden = true;
    }

    // 2. Render Step List
    routeSteps.innerHTML = "";
    result.steps.forEach((step) => {
      const li = document.createElement("li");
      li.className = "step-item";
      li.setAttribute("data-step-index", step.index);

      const repeatTagHtml = step.isRepeat ? `<span class="repeat-tag">repeat</span>` : "";

      li.innerHTML = `
        <span class="step-badge">
          <span>${step.index}.</span>
          <span>${step.from} &rarr; ${step.to}, ${step.length} m</span>
        </span>
        ${repeatTagHtml}
      `;

      routeSteps.appendChild(li);
    });
    routeStepsContainer.style.display = "block";

    // 3. Render Totals
    if (result.type === "repeats") {
      routeTotals.textContent = `Street length ${result.originalLength} + repeats ${result.extraDistance} = ${result.totalDistance}`;
    } else {
      routeTotals.textContent = `Total distance: ${result.totalDistance}`;
    }
    routeTotals.style.display = "block";

    // 4. Draw Route onto SVG layer
    drawRouteOnMap(graph, result.steps);

    window.RouteWise.showToast(`Route found! Total distance: ${result.totalDistance} m`);
  }

  // Bind Events
  btnFindRoute.addEventListener("click", handleFindRoute);

  // Subscribe to Map changes from planner.js
  if (window.RouteWise) {
    window.RouteWise.onMapChange((updatedGraph) => {
      updateRouteControls(updatedGraph);
    });

    // Initialize with current graph
    updateRouteControls(window.RouteWise.getGraph());
  }
})();
