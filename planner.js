// RouteWise - Interactive Planner Map & Live Analysis
// Mathematical Foundations for Computer Science (2CS802CC26), Nirma University

(function () {
  "use strict";

  // Application State
  const state = {
    graph: { junctions: [], streets: [] },
    activeTool: "add-junction", // 'add-junction' | 'add-street' | 'move' | 'delete'
    selectedJunction: null,
    draggingJunction: null,
    dragOffset: { x: 0, y: 0 },
    listeners: []
  };

  // DOM Elements
  const mapSvg = document.getElementById("map-svg");
  const streetLayer = document.getElementById("street-layer");
  const routeLayer = document.getElementById("route-layer");
  const junctionLayer = document.getElementById("junction-layer");
  const toolTipText = document.getElementById("tool-tip-text");
  const examplesDropdown = document.getElementById("examples-dropdown");
  const toastContainer = document.getElementById("toast-container");

  const cardVerdict = document.getElementById("card-verdict");
  const cardDegrees = document.getElementById("card-degrees");
  const cardRoute = document.getElementById("card-route");

  // Tooltip & Popover references
  let hoverTooltip = null;
  let activePopover = null;

  /**
   * Generates next alphabetical junction ID (A..Z, then A1..Z1, B1..Z1, etc.)
   */
  function getNextJunctionId(junctions) {
    const existing = new Set(junctions.map(j => j.id));
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let suffix = 0; suffix < 100; suffix++) {
      const s = suffix === 0 ? "" : String(suffix);
      for (let i = 0; i < letters.length; i++) {
        const candidate = letters[i] + s;
        if (!existing.has(candidate)) {
          return candidate;
        }
      }
    }
    return "J" + (junctions.length + 1);
  }

  /**
   * Displays a toast notification that automatically dismisses after 3 seconds.
   */
  function showToast(message) {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.textContent = String(message || "Action performed");
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.25s ease";
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }, 3000);
  }

  /**
   * Updates toolbar tip text based on active tool.
   */
  function updateToolTips() {
    if (!toolTipText) return;
    const tips = {
      "add-junction": "Click empty space on the grid to place a junction.",
      "add-street": "Click the start junction, then click the end junction to connect them.",
      "move": "Click and drag any junction to reposition it.",
      "delete": "Click a junction or street to remove it."
    };
    const tipSpan = toolTipText.querySelector("span");
    if (tipSpan) {
      tipSpan.textContent = tips[state.activeTool] || "";
    }
  }

  /**
   * Converts mouse event client coordinates to SVG viewBox (900x600) coordinates.
   */
  function getSvgCoordinates(evt) {
    const rect = mapSvg.getBoundingClientRect();
    const scaleX = 900 / rect.width;
    const scaleY = 600 / rect.height;
    const x = Math.round((evt.clientX - rect.left) * scaleX);
    const y = Math.round((evt.clientY - rect.top) * scaleY);
    return {
      x: Math.max(25, Math.min(875, x)),
      y: Math.max(25, Math.min(575, y))
    };
  }

  /**
   * Initializes floating hover tooltip element.
   */
  function ensureTooltip() {
    if (!hoverTooltip) {
      hoverTooltip = document.createElement("div");
      hoverTooltip.className = "map-tooltip";
      hoverTooltip.style.display = "none";
      document.body.appendChild(hoverTooltip);
    }
  }

  function showTooltip(text, clientX, clientY) {
    ensureTooltip();
    hoverTooltip.textContent = text;
    hoverTooltip.style.left = `${clientX + 14}px`;
    hoverTooltip.style.top = `${clientY + 14}px`;
    hoverTooltip.style.display = "block";
  }

  function hideTooltip() {
    if (hoverTooltip) {
      hoverTooltip.style.display = "none";
    }
  }

  /**
   * Removes any active street length popover.
   */
  function closeStreetPopover() {
    if (activePopover && activePopover.parentNode) {
      activePopover.parentNode.removeChild(activePopover);
      activePopover = null;
    }
  }

  /**
   * Displays inline popover prompting user for street length.
   */
  function promptStreetLength(j1, j2, defaultLength, onConfirm) {
    closeStreetPopover();

    const popover = document.createElement("div");
    popover.className = "street-popover";

    const title = document.createElement("h4");
    title.textContent = `Street Length: ${j1.id} \u2194 ${j2.id}`;

    const inputGroup = document.createElement("div");
    inputGroup.className = "popover-input-group";

    const input = document.createElement("input");
    input.type = "number";
    input.className = "popover-input";
    input.value = defaultLength;
    input.min = "1";
    input.step = "1";

    const unit = document.createElement("span");
    unit.textContent = "m";
    unit.style.fontSize = "0.85rem";
    unit.style.color = "var(--text-muted)";

    inputGroup.appendChild(input);
    inputGroup.appendChild(unit);

    const actions = document.createElement("div");
    actions.className = "popover-actions";

    const btnCancel = document.createElement("button");
    btnCancel.type = "button";
    btnCancel.className = "btn btn-secondary";
    btnCancel.textContent = "Cancel";

    const btnOk = document.createElement("button");
    btnOk.type = "button";
    btnOk.className = "btn btn-primary";
    btnOk.textContent = "Confirm";

    actions.appendChild(btnCancel);
    actions.appendChild(btnOk);

    popover.appendChild(title);
    popover.appendChild(inputGroup);
    popover.appendChild(actions);

    const mapContainer = document.getElementById("map-container");
    mapContainer.style.position = "relative";
    popover.style.top = "50%";
    popover.style.left = "50%";
    popover.style.transform = "translate(-50%, -50%)";
    mapContainer.appendChild(popover);
    activePopover = popover;

    input.focus();
    input.select();

    function confirmInput() {
      const val = parseFloat(input.value);
      if (isNaN(val) || val <= 0) {
        showToast("Street length must be a positive number.");
        return;
      }
      closeStreetPopover();
      onConfirm(Math.round(val));
    }

    btnOk.addEventListener("click", confirmInput);
    btnCancel.addEventListener("click", () => {
      closeStreetPopover();
      state.selectedJunction = null;
      renderMap();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmInput();
      } else if (e.key === "Escape") {
        closeStreetPopover();
        state.selectedJunction = null;
        renderMap();
      }
    });
  }

  /**
   * Renders the complete SVG map: streets, labels, and junctions.
   */
  function renderMap() {
    if (!streetLayer || !junctionLayer) return;

    // Clear SVG layers (preserve routeLayer structure)
    streetLayer.innerHTML = "";
    junctionLayer.innerHTML = "";

    const degrees = typeof getDegrees === "function" ? getDegrees(state.graph) : {};
    const jMap = new Map(state.graph.junctions.map(j => [j.id, j]));

    // 1. Draw Streets and midpoint length labels
    state.graph.streets.forEach(street => {
      const fromJ = jMap.get(street.from);
      const toJ = jMap.get(street.to);
      if (!fromJ || !toJ) return;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", fromJ.x);
      line.setAttribute("y1", fromJ.y);
      line.setAttribute("x2", toJ.x);
      line.setAttribute("y2", toJ.y);
      line.setAttribute("class", "street-line");
      line.setAttribute("data-street-id", street.id);

      line.addEventListener("click", (e) => {
        e.stopPropagation();
        if (state.activeTool === "delete") {
          state.graph.streets = state.graph.streets.filter(s => s.id !== street.id);
          showToast(`Deleted street ${street.from}-${street.to}`);
          notifyMapChange();
        }
      });

      streetLayer.appendChild(line);

      // Midpoint length label
      const midX = (fromJ.x + toJ.x) / 2;
      const midY = (fromJ.y + toJ.y) / 2;
      const labelText = `${street.length}m`;
      const badgeWidth = Math.max(34, labelText.length * 8 + 12);
      const badgeHeight = 20;

      const labelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      labelGroup.setAttribute("class", "street-label-group");
      labelGroup.setAttribute("transform", `translate(${midX}, ${midY})`);

      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("class", "street-label-bg");
      rect.setAttribute("x", -badgeWidth / 2);
      rect.setAttribute("y", -badgeHeight / 2);
      rect.setAttribute("width", badgeWidth);
      rect.setAttribute("height", badgeHeight);

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("class", "street-label-text");
      text.textContent = labelText;

      labelGroup.appendChild(rect);
      labelGroup.appendChild(text);

      labelGroup.addEventListener("click", (e) => {
        e.stopPropagation();
        if (state.activeTool === "delete") {
          state.graph.streets = state.graph.streets.filter(s => s.id !== street.id);
          showToast(`Deleted street ${street.from}-${street.to}`);
          notifyMapChange();
        }
      });

      streetLayer.appendChild(labelGroup);
    });

    // 2. Draw Junction Nodes
    state.graph.junctions.forEach(j => {
      const deg = degrees[j.id] || 0;
      const isOdd = deg % 2 !== 0;
      const isIsolated = deg === 0;

      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      let nodeClass = "junction-node";
      if (isIsolated) {
        nodeClass += " junction-isolated";
      } else if (isOdd) {
        nodeClass += " junction-odd";
      } else {
        nodeClass += " junction-even";
      }

      if (state.selectedJunction && state.selectedJunction.id === j.id) {
        nodeClass += " selected";
      }
      group.setAttribute("class", nodeClass);
      group.setAttribute("transform", `translate(${j.x}, ${j.y})`);
      group.setAttribute("data-junction-id", j.id);

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("r", "18");

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("class", "junction-label");
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("dominant-baseline", "central");
      label.textContent = j.id;

      group.appendChild(circle);
      group.appendChild(label);

      // Tooltip events
      group.addEventListener("mouseenter", (e) => {
        const typeStr = isIsolated ? "isolated" : (isOdd ? "odd" : "even");
        showTooltip(`Junction ${j.id}, degree ${deg} (${typeStr})`, e.clientX, e.clientY);
      });
      group.addEventListener("mousemove", (e) => {
        const typeStr = isIsolated ? "isolated" : (isOdd ? "odd" : "even");
        showTooltip(`Junction ${j.id}, degree ${deg} (${typeStr})`, e.clientX, e.clientY);
      });
      group.addEventListener("mouseleave", hideTooltip);

      // Interaction handlers
      group.addEventListener("click", (e) => {
        e.stopPropagation();
        handleJunctionClick(j);
      });

      group.addEventListener("mousedown", (e) => {
        if (state.activeTool === "move") {
          e.stopPropagation();
          state.draggingJunction = j;
          const coords = getSvgCoordinates(e);
          state.dragOffset = { x: j.x - coords.x, y: j.y - coords.y };
        }
      });

      junctionLayer.appendChild(group);
    });
  }

  /**
   * Handles click events on a junction based on active tool.
   */
  function handleJunctionClick(junction) {
    if (state.activeTool === "delete") {
      state.graph.junctions = state.graph.junctions.filter(j => j.id !== junction.id);
      state.graph.streets = state.graph.streets.filter(s => s.from !== junction.id && s.to !== junction.id);
      hideTooltip();
      showToast(`Deleted junction ${junction.id}`);
      notifyMapChange();
      return;
    }

    if (state.activeTool === "add-street") {
      if (!state.selectedJunction) {
        state.selectedJunction = junction;
        renderMap();
        showToast(`Selected start junction ${junction.id}. Now click destination.`);
        return;
      }

      if (state.selectedJunction.id === junction.id) {
        showToast("Cannot connect a junction to itself.");
        state.selectedJunction = null;
        renderMap();
        return;
      }

      const j1 = state.selectedJunction;
      const j2 = junction;
      const exists = state.graph.streets.some(s =>
        (s.from === j1.id && s.to === j2.id) || (s.from === j2.id && s.to === j1.id)
      );

      if (exists) {
        showToast(`A street already exists between ${j1.id} and ${j2.id}.`);
        state.selectedJunction = null;
        renderMap();
        return;
      }

      const pixelDist = Math.round(Math.hypot(j2.x - j1.x, j2.y - j1.y));
      promptStreetLength(j1, j2, pixelDist, (length) => {
        const nextStreetId = state.graph.streets.reduce((max, s) => Math.max(max, s.id), 0) + 1;
        state.graph.streets.push({
          id: nextStreetId,
          from: j1.id,
          to: j2.id,
          length
        });
        state.selectedJunction = null;
        showToast(`Added street ${j1.id} \u2194 ${j2.id} (${length} m)`);
        notifyMapChange();
      });
    }
  }

  /**
   * Updates analysis panel (Verdict banner and Junction Degrees table with Handshaking).
   */
  function renderAnalysis() {
    if (typeof getVerdict !== "function" || typeof getDegrees !== "function") return;

    const verdict = getVerdict(state.graph);
    const degrees = getDegrees(state.graph);
    const handshaking = typeof checkHandshaking === "function" ? checkHandshaking(state.graph) : { sumOfDegrees: 0, twiceStreets: 0, holds: false };

    // 1. Render Verdict Banner
    if (cardVerdict) {
      let bannerClass = "banner-gray";
      if (verdict.type === "circuit") bannerClass = "banner-green";
      else if (verdict.type === "path") bannerClass = "banner-blue";
      else if (verdict.type === "repeats") bannerClass = "banner-orange";
      else if (verdict.type === "not-connected") bannerClass = "banner-red";

      cardVerdict.innerHTML = `
        <div class="analysis-header">
          <h3 class="analysis-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Euler Verdict
          </h3>
        </div>
        <div class="banner ${bannerClass}">
          <div>
            <strong>${verdict.type.toUpperCase().replace("-", " ")}:</strong> ${verdict.message}
          </div>
        </div>
      `;
    }

    // 2. Render Degrees & Handshaking Card
    if (cardDegrees) {
      const rows = state.graph.junctions.map(j => {
        const deg = degrees[j.id] || 0;
        let badgeHtml = "";
        if (deg === 0) {
          badgeHtml = `<span class="badge" style="background:#E2E8F0; color:#475569;">Isolated (0)</span>`;
        } else if (deg % 2 !== 0) {
          badgeHtml = `<span class="badge badge-odd">Odd (${deg})</span>`;
        } else {
          badgeHtml = `<span class="badge badge-even">Even (${deg})</span>`;
        }

        return `
          <tr>
            <td><strong>${j.id}</strong></td>
            <td>${deg}</td>
            <td>${badgeHtml}</td>
          </tr>
        `;
      }).join("");

      const isolatedJunctions = state.graph.junctions.filter(j => (degrees[j.id] || 0) === 0);
      const isolatedWarningHtml = isolatedJunctions.length > 0
        ? `<div class="isolated-warning">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
             <span>Junction ${isolatedJunctions.map(j => j.id).join(", ")} has no streets and is ignored.</span>
           </div>`
        : "";

      cardDegrees.innerHTML = `
        <div class="analysis-header">
          <h3 class="analysis-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
            Junction Degrees
          </h3>
        </div>
        <div class="degree-table-wrapper">
          <table class="degree-table">
            <thead>
              <tr>
                <th>Junction</th>
                <th>Degree</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">No junctions added yet.</td></tr>`}
            </tbody>
          </table>
        </div>
        <div class="handshaking-box">
          Sum of degrees = ${handshaking.sumOfDegrees} = 2 \u00D7 ${state.graph.streets.length} streets ${handshaking.holds ? "\u2713" : "\u2717"}
        </div>
        ${isolatedWarningHtml}
      `;
    }
  }

  /**
   * Fires map change notification to registered listeners (e.g., route planner).
   */
  function notifyMapChange() {
    renderMap();
    renderAnalysis();
    state.listeners.forEach(fn => {
      try {
        fn(state.graph);
      } catch (err) {
        // Safe execution
      }
    });
  }

  /**
   * Sets up map canvas events: adding junctions and drag-move interactions.
   */
  function setupMapInteractions() {
    mapSvg.addEventListener("click", (e) => {
      if (state.activeTool === "add-junction") {
        const coords = getSvgCoordinates(e);
        const nextId = getNextJunctionId(state.graph.junctions);
        state.graph.junctions.push({ id: nextId, x: coords.x, y: coords.y });
        showToast(`Added junction ${nextId}`);
        notifyMapChange();
      } else if (state.activeTool === "add-street" && state.selectedJunction) {
        state.selectedJunction = null;
        renderMap();
      }
    });

    window.addEventListener("mousemove", (e) => {
      if (state.draggingJunction && state.activeTool === "move") {
        const coords = getSvgCoordinates(e);
        state.draggingJunction.x = Math.max(25, Math.min(875, coords.x + state.dragOffset.x));
        state.draggingJunction.y = Math.max(25, Math.min(575, coords.y + state.dragOffset.y));
        renderMap();
      }
    });

    window.addEventListener("mouseup", () => {
      if (state.draggingJunction) {
        state.draggingJunction = null;
        notifyMapChange();
      }
    });
  }

  /**
   * Sets up toolbar buttons and tool selection.
   */
  function setupToolbar() {
    const toolBtns = document.querySelectorAll(".tool-btn[data-tool]");
    toolBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        toolBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.activeTool = btn.getAttribute("data-tool");
        state.selectedJunction = null;

        mapSvg.classList.remove("cursor-move", "cursor-delete", "cursor-street");
        if (state.activeTool === "move") mapSvg.classList.add("cursor-move");
        else if (state.activeTool === "delete") mapSvg.classList.add("cursor-delete");
        else if (state.activeTool === "add-street") mapSvg.classList.add("cursor-street");

        updateToolTips();
        renderMap();
      });
    });

    // Clear tool modal confirmation
    const btnClear = document.getElementById("tool-clear");
    if (btnClear) {
      btnClear.addEventListener("click", () => {
        showModalConfirm("Clear the whole map?", () => {
          state.graph = { junctions: [], streets: [] };
          state.selectedJunction = null;
          showToast("Map cleared");
          notifyMapChange();
        });
      });
    }

    // Populate presets dropdown
    if (examplesDropdown && typeof PRESETS !== "undefined") {
      PRESETS.forEach((preset, idx) => {
        const opt = document.createElement("option");
        opt.value = String(idx);
        opt.textContent = preset.name;
        examplesDropdown.appendChild(opt);
      });

      examplesDropdown.addEventListener("change", () => {
        const idx = parseInt(examplesDropdown.value, 10);
        if (!isNaN(idx) && PRESETS[idx]) {
          loadPreset(PRESETS[idx]);
        }
      });
    }
  }

  /**
   * Confirmation modal dialog.
   */
  function showModalConfirm(message, onConfirm) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const modal = document.createElement("div");
    modal.className = "modal-card";

    const title = document.createElement("h3");
    title.textContent = message;
    title.style.fontSize = "1.05rem";
    title.style.fontWeight = "600";

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "0.75rem";
    actions.style.justifyContent = "flex-end";

    const btnCancel = document.createElement("button");
    btnCancel.className = "btn btn-secondary";
    btnCancel.textContent = "Cancel";

    const btnOk = document.createElement("button");
    btnOk.className = "btn btn-primary";
    btnOk.textContent = "Clear";

    actions.appendChild(btnCancel);
    actions.appendChild(btnOk);

    modal.appendChild(title);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function close() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    btnCancel.addEventListener("click", close);
    btnOk.addEventListener("click", () => {
      close();
      onConfirm();
    });
  }

  /**
   * Loads a preset map into the application state.
   */
  function loadPreset(preset) {
    state.graph = JSON.parse(JSON.stringify(preset.graph));
    state.selectedJunction = null;
    showToast(`Loaded preset: ${preset.name}`);
    notifyMapChange();
  }

  // Initialize
  function init() {
    setupToolbar();
    setupMapInteractions();
    updateToolTips();

    // Load initial map (Practice preset)
    if (typeof PRESETS !== "undefined" && PRESETS.length > 0) {
      loadPreset(PRESETS[0]);
      if (examplesDropdown) examplesDropdown.value = "0";
    } else {
      notifyMapChange();
    }
  }

  // Global interface for route-view.js in Commit 4
  window.RouteWise = {
    getGraph: () => state.graph,
    setGraph: (g) => { state.graph = g; notifyMapChange(); },
    onMapChange: (fn) => { state.listeners.push(fn); },
    renderMap,
    renderAnalysis,
    showToast,
    getSvgElement: () => mapSvg,
    getRouteLayer: () => routeLayer
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
