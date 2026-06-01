const canvas = document.querySelector("#motion-field");
const ctx = canvas.getContext("2d");
const menuButton = document.querySelector("#menu-button");
const mobileNav = document.querySelector("#mobile-nav");
const inspector = document.querySelector("#inspector");
const packetButtons = document.querySelectorAll(".packet");
const harvestForm = document.querySelector("#harvest-form");
const harvestStatus = document.querySelector("#harvest-status");
const harvestWatchlist = document.querySelector("#harvest-watchlist");
const symbolSelect = document.querySelector("#symbol-select");
const marketplaceList = document.querySelector("#marketplace-list");
const marketCoverage = document.querySelector("#market-coverage");
const marketSymbolFilter = document.querySelector("#market-symbol-filter");
const marketRegimeFilter = document.querySelector("#market-regime-filter");
const marketSort = document.querySelector("#market-sort");
const marketFilterCount = document.querySelector("#market-filter-count");
const agentRoster = document.querySelector("#agent-roster");
const topScore = document.querySelector("#top-score");
const topScoreLabel = document.querySelector("#top-score-label");
const packetCount = document.querySelector("#packet-count");
const executionCount = document.querySelector("#execution-count");
const executionPnl = document.querySelector("#execution-pnl");
const decisionLog = document.querySelector("#decision-log");
const packetDetail = document.querySelector("#packet-detail");
const agentVault = document.querySelector("#agent-vault");
const riskForm = document.querySelector("#risk-form");
const riskResult = document.querySelector("#risk-result");
const decisionForm = document.querySelector("#decision-form");
const decisionMemory = document.querySelector("#decision-memory");
const decisionResult = document.querySelector("#decision-result");
const executionForm = document.querySelector("#execution-form");
const executionDecision = document.querySelector("#execution-decision");
const executionBoard = document.querySelector("#execution-board");
const portfolioGrid = document.querySelector("#portfolio-grid");
const statusGrid = document.querySelector("#status-grid");
const integrationGrid = document.querySelector("#integration-grid");
const intentBoard = document.querySelector("#intent-board");
const simulationGrid = document.querySelector("#simulation-grid");
const evaluationGrid = document.querySelector("#evaluation-grid");
const swarmsGrid = document.querySelector("#swarms-grid");
const swarmsPayload = document.querySelector("#swarms-payload");

let width = 0;
let height = 0;
let time = 0;
let marketplaceMemories = [];
let dashboardMemories = [];
let dashboardDecisions = [];
let dashboardExecutions = [];

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function ribbonPoint(side, row, step, phase) {
  const depth = step / 42;
  const perspective = 1 - depth * 0.72;
  const edge = side === "left" ? -80 : width + 80;
  const pull = side === "left" ? 1 : -1;
  const lane = row * 58 + Math.sin(phase + row) * 22;
  const x = edge + pull * (depth * width * 0.42 + Math.sin(phase + step * 0.34) * 42);
  const y = height * 0.18 + lane + Math.sin(phase * 1.3 + step * 0.28 + row) * 34;
  return { x, y, perspective };
}

function drawRibbon(side, row, color, phase) {
  ctx.beginPath();
  for (let step = 0; step <= 42; step += 1) {
    const point = ribbonPoint(side, row, step, phase);
    if (step === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.8 - row * 0.26;
  ctx.globalAlpha = 0.22;
  ctx.stroke();

  for (let step = 3; step <= 39; step += 6) {
    const point = ribbonPoint(side, row, step, phase);
    const size = 7 * point.perspective;
    ctx.globalAlpha = 0.34 * point.perspective;
    ctx.fillStyle = color;
    ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size);
  }
}

function drawDepthWaves() {
  ctx.clearRect(0, 0, width, height);
  time += 0.008;

  const colors = ["#e50914", "#ffffff", "#00f0ff"];
  for (let row = 0; row < 7; row += 1) {
    drawRibbon("left", row, colors[row % colors.length], time + row * 0.42);
    drawRibbon("right", row, colors[(row + 1) % colors.length], time * 0.86 + row * 0.37);
  }

  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  for (let ring = 0; ring < 4; ring += 1) {
    const scale = 1 + ring * 0.22 + Math.sin(time + ring) * 0.025;
    ctx.beginPath();
    ctx.ellipse(width / 2, height * 0.58, width * 0.18 * scale, height * 0.13 * scale, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(drawDepthWaves);
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

menuButton?.addEventListener("click", () => {
  mobileNav.classList.toggle("open");
});

mobileNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => mobileNav.classList.remove("open"));
});

packetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    packetButtons.forEach((packet) => packet.classList.remove("active"));
    button.classList.add("active");
    if (!inspector) return;
    inspector.innerHTML = `
      <span>Selected Memory</span>
      <h3>${button.dataset.name}</h3>
      <p>${button.dataset.copy}</p>
      <div class="meter"><i style="--value: ${button.dataset.score}%"></i></div>
    `;
  });
});

const apiOrigin = window.location.protocol === "file:" ? "http://127.0.0.1:4260" : "";

async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${apiOrigin}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("API unreachable. Open http://127.0.0.1:4260/index.html and keep preview.cmd running.");
  }
  const payload = await response.json();
  if (!response.ok || payload.error) throw new Error(payload.error || "Request failed");
  return payload;
}

function pct(value) {
  const number = Number(value || 0);
  return `${number >= 0 ? "+" : ""}${number.toFixed(2)}%`;
}

function money(value) {
  const number = Number(value || 0);
  if (number >= 1000) return number.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (number >= 1) return number.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return number.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function compact(value) {
  return Number(value || 0).toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 1 });
}

function renderMarketCoverage(rows) {
  if (!marketCoverage) return;
  marketCoverage.innerHTML = rows
    .map(
      (row) => `
        <article>
          <span>${row.name}</span>
          <strong>${row.symbol}</strong>
          <p>${row.regime} · ${pct(row.changePct)} · score ${row.score}</p>
          <small>${money(row.price)} · volume ${compact(row.quoteVolume)}</small>
        </article>
      `
    )
    .join("");
}

function filteredMarketplaceMemories() {
  const symbol = marketSymbolFilter?.value || "";
  const regime = marketRegimeFilter?.value || "";
  const sort = marketSort?.value || "score";
  const filtered = marketplaceMemories.filter((memory) => {
    const symbolMatch = !symbol || memory.symbol === symbol;
    const regimeMatch = !regime || memory.regime === regime;
    return symbolMatch && regimeMatch;
  });
  return filtered.sort((a, b) => {
    if (sort === "newest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    if (sort === "outcome") return Number(b.outcomePct || 0) - Number(a.outcomePct || 0);
    if (sort === "drawdown") return Number(b.maxDrawdownPct || 0) - Number(a.maxDrawdownPct || 0);
    if (sort === "imports") return Number(b.imports || 0) - Number(a.imports || 0);
    return Number(b.score || 0) - Number(a.score || 0);
  });
}

function renderMarketplaceFilters(memories) {
  if (marketRegimeFilter) {
    const current = marketRegimeFilter.value;
    const regimes = [...new Set(memories.map((memory) => memory.regime).filter(Boolean))].sort();
    marketRegimeFilter.innerHTML = `<option value="">All regimes</option>${regimes
      .map((regime) => `<option value="${regime}">${regime}</option>`)
      .join("")}`;
    if (regimes.includes(current)) marketRegimeFilter.value = current;
  }
  if (marketFilterCount) {
    const filtered = filteredMarketplaceMemories();
    marketFilterCount.textContent = `${filtered.length} of ${memories.length} packets`;
  }
}

function renderMarketplace(memories) {
  if (!marketplaceList) return;
  marketplaceMemories = memories;
  renderMarketplaceFilters(memories);
  const visibleMemories = filteredMarketplaceMemories();
  if (!visibleMemories.length) {
    marketplaceList.innerHTML = `
      <article><span>Memory Exchange</span><h2>No matching packets</h2><p>Harvest a symbol from the Dashboard or clear the filters to view available packet history.</p><b>0</b></article>
    `;
    return;
  }
  marketplaceList.innerHTML = visibleMemories
    .map(
      (memory) => `
        <article>
          <span>${memory.agentName} · ${memory.symbol} · ${memory.granularity}</span>
          <h2>${memory.regime}</h2>
          <p>${memory.thesis}</p>
          <small>${memory.source} · outcome ${pct(memory.outcomePct)} · drawdown ${pct(memory.maxDrawdownPct)} · imports ${memory.imports || 0}</small>
          <a class="inline-link" href="packet.html?id=${encodeURIComponent(memory.id)}">Inspect packet</a>
          <b>${memory.score}</b>
        </article>
      `
    )
    .join("");
}

function renderPacketDetail(memory) {
  if (!packetDetail) return;
  const imports = memory.importEvents || [];
  const breakdown = memory.scoreBreakdown || {};
  packetDetail.innerHTML = `
    <p class="eyebrow">Memory Packet</p>
    <div class="packet-detail-grid">
      <div>
        <h1>${memory.symbol} ${memory.regime}</h1>
        <p class="hero-text">${memory.thesis}</p>
      </div>
      <aside class="packet-score">
        <span>Score</span>
        <strong>${memory.score}</strong>
      </aside>
    </div>
    <div class="packet-stat-grid">
      <article><span>Creator</span><strong>${memory.agentName}</strong></article>
      <article><span>Source</span><strong>${memory.source}</strong></article>
      <article><span>Outcome</span><strong>${pct(memory.outcomePct)}</strong></article>
      <article><span>Max Drawdown</span><strong>${pct(memory.maxDrawdownPct)}</strong></article>
      <article><span>Observed From</span><strong>${new Date(memory.observedFrom).toLocaleString()}</strong></article>
      <article><span>Observed To</span><strong>${new Date(memory.observedTo).toLocaleString()}</strong></article>
    </div>
    <div class="score-breakdown">
      <h2>Score Breakdown</h2>
      <div class="score-bars">
        ${Object.entries({
          "Outcome": breakdown.outcome || 0,
          "Drawdown Control": breakdown.drawdownControl || 0,
          "Volatility Signal": breakdown.volatilitySignal || 0,
          "Regime Clarity": breakdown.regimeClarity || 0,
          "Evidence Depth": breakdown.evidenceDepth || 0,
        })
          .map(
            ([label, value]) => `
              <article>
                <span>${label}</span>
                <strong>${value}</strong>
                <div class="meter"><i style="--value: ${Math.min(100, value * 4)}%"></i></div>
              </article>
            `
          )
          .join("")}
      </div>
    </div>
    <form id="import-form" class="harvest-form import-form">
      <label>Import Into<select name="agentId"><option value="risk-warden">Risk Warden</option><option value="momentum-hunter">Momentum Hunter</option><option value="liquidity-scout">Liquidity Scout</option></select></label>
      <button type="submit">Import Memory</button>
    </form>
    <a class="button primary risk-link" href="risk.html?score=${encodeURIComponent(memory.score)}">Evaluate Risk Policy</a>
    <a class="button ghost risk-link" href="decision.html?memoryId=${encodeURIComponent(memory.id)}">Simulate Decision</a>
    <p id="import-status" class="status-line">${memory.imports || 0} imports recorded.</p>
    <div class="import-log">
      ${
        imports.length
          ? imports.map((event) => `<p>${event.agentName} imported this packet at ${new Date(event.createdAt).toLocaleString()}.</p>`).join("")
          : "<p>No import events yet.</p>"
      }
    </div>
  `;

  document.querySelector("#import-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.querySelector("#import-status");
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    body.memoryId = memory.id;
    status.textContent = "Importing memory...";
    try {
      await api("/api/imports", { method: "POST", body: JSON.stringify(body) });
      status.textContent = "Memory imported.";
      await loadPacketDetail();
    } catch (error) {
      status.textContent = error.message;
    }
  });
}

function renderRisk(result) {
  if (!riskResult) return;
  riskResult.classList.toggle("blocked", !result.allowed);
  riskResult.innerHTML = `
    <span>Status</span>
    <h2>${result.decision}</h2>
    <p>Exposure ${result.exposurePct.toFixed(2)}% · Stop risk ${result.lossAtStopPct.toFixed(2)}%</p>
    <div class="risk-checks">
      ${result.checks
        .map(
          (check) => `
            <article class="${check.pass ? "pass" : "fail"}">
              <strong>${check.name}</strong>
              <p>${check.detail}</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderDecision(decision) {
  if (!decisionResult) return;
  decisionResult.classList.toggle("blocked", decision.action === "blocked");
  decisionResult.innerHTML = `
    <span>Action</span>
    <h2>${decision.action}</h2>
    <p>${decision.rationale}</p>
    <div class="risk-checks">
      <article><strong>Agent</strong><p>${decision.agentName}</p></article>
      <article><strong>Packet</strong><p>${decision.symbol} · ${decision.regime} · score ${decision.score}</p></article>
      <article class="${decision.risk.allowed ? "pass" : "fail"}"><strong>Risk</strong><p>${decision.risk.decision}</p></article>
    </div>
  `;
}

function renderExecutions(executions) {
  if (!executionBoard) return;
  if (!executions.length) {
    executionBoard.innerHTML = `<article><span>Ledger</span><h2>No executions yet</h2><p>Allow trade decisions can be recorded here with entry, stop, size, risk, and exit.</p></article>`;
    return;
  }
  executionBoard.innerHTML = executions
    .map(
      (execution) => `
        <article>
          <span>${execution.agentName} · ${execution.symbol} · ${execution.status}</span>
          <h2>${execution.side} ${execution.size}</h2>
          <p>Entry ${execution.entryPrice} · Stop ${execution.stopPrice} · Risk ${execution.riskAmount}</p>
          ${
            execution.status === "open"
              ? `<form class="close-execution-form" data-id="${execution.id}"><input name="exitPrice" type="number" step="0.01" placeholder="Exit price" required /><button type="submit">Close</button></form>`
              : `<small>Exit ${execution.exitPrice} · PnL ${execution.pnl}</small>`
          }
        </article>
      `
    )
    .join("");
}

function renderPortfolio(portfolio) {
  if (!portfolioGrid) return;
  const totals = portfolio.totals;
  portfolioGrid.innerHTML = `
    <article class="portfolio-hero-card">
      <span>Realized PnL</span>
      <h2>${totals.realizedPnl.toFixed(2)}</h2>
      <p>Closed executions ${totals.closedExecutions} · Win rate ${totals.winRate.toFixed(2)}%</p>
    </article>
    <article><span>Open Risk</span><h2>${totals.openRisk.toFixed(2)}</h2><p>${totals.openExecutions} open executions</p></article>
    <article><span>Memory Packets</span><h2>${totals.memories}</h2><p>Best score ${portfolio.bestMemory ? portfolio.bestMemory.score : 0}</p></article>
    <article><span>Decisions</span><h2>${totals.decisions}</h2><p>${totals.executions} execution records</p></article>
    <section class="portfolio-table">
      <h2>Agent Performance</h2>
      ${portfolio.byAgent
        .map(
          (agent) => `
            <article>
              <span>${agent.name}</span>
              <strong>${agent.realizedPnl.toFixed(2)}</strong>
              <p>${agent.memories} memories · ${agent.decisions} decisions · ${agent.executions} executions · avg score ${agent.averageMemoryScore}</p>
            </article>
          `
        )
        .join("")}
    </section>
    <section class="portfolio-table">
      <h2>Recent Decisions</h2>
      ${
        portfolio.recentDecisions.length
          ? portfolio.recentDecisions
              .map((decision) => `<article><span>${decision.agentName}</span><strong>${decision.action}</strong><p>${decision.symbol} · ${decision.regime} · score ${decision.score}</p></article>`)
              .join("")
          : "<article><span>Decisions</span><strong>None</strong><p>No decisions recorded yet.</p></article>"
      }
    </section>
  `;
}

function renderSimulationResults(results) {
  if (!simulationGrid) return;
  const best = results.summary.bestPacket;
  simulationGrid.innerHTML = `
    <article class="portfolio-hero-card">
      <span>Packet Sample</span>
      <h2>${results.sample.packets}</h2>
      <p>${results.sample.decisions} decisions · ${results.sample.executions} execution records</p>
    </article>
    <article><span>Average Score</span><h2>${results.summary.averageScore}</h2><p>Across harvested packets</p></article>
    <article><span>Average Outcome</span><h2>${pct(results.summary.averageOutcomePct)}</h2><p>Observed packet windows</p></article>
    <article><span>Worst Drawdown</span><h2>${pct(results.summary.worstDrawdownPct)}</h2><p>Deepest packet drawdown</p></article>
    <article><span>Best Packet</span><h2>${best ? best.score : 0}</h2><p>${best ? `${best.symbol} · ${best.regime}` : "No packets"}</p></article>
    <section class="portfolio-table">
      <h2>Symbol Results</h2>
      ${results.bySymbol
        .map((row) => `<article><span>${row.symbol}</span><strong>${row.avgScore}</strong><p>${row.packets} packets · outcome ${pct(row.avgOutcomePct)} · drawdown ${pct(row.worstDrawdownPct)}</p></article>`)
        .join("")}
    </section>
    <section class="portfolio-table">
      <h2>Top Packets</h2>
      ${results.rankedPackets
        .slice(0, 8)
        .map((memory) => `<article><span>${memory.agentName} · ${memory.symbol}</span><strong>${memory.score}</strong><p>${memory.regime} · outcome ${pct(memory.outcomePct)} · drawdown ${pct(memory.maxDrawdownPct)}</p></article>`)
        .join("")}
    </section>
  `;
}

function renderAgentEvaluation(results) {
  if (!evaluationGrid) return;
  evaluationGrid.innerHTML = results.agents
    .map(
      (agent) => `
        <article class="evaluation-card">
          <span>${agent.name}</span>
          <h2>${agent.combinedAvgScore}</h2>
          <p>${agent.focus}</p>
          <div class="evaluation-metrics">
            <b>${agent.publishedPackets}<small>published</small></b>
            <b>${agent.importedPackets}<small>imported</small></b>
            <b>${agent.combinedSymbols}<small>symbols</small></b>
            <b>${agent.scoreLift >= 0 ? "+" : ""}${agent.scoreLift}<small>score lift</small></b>
          </div>
          <small>New symbols ${agent.gainedSymbols.length ? agent.gainedSymbols.join(", ") : "none"} · new regimes ${agent.gainedRegimes.length ? agent.gainedRegimes.join(", ") : "none"} · decisions ${agent.decisions}</small>
        </article>
      `
    )
    .join("");
}

function renderSwarmsStatus(status) {
  if (!swarmsGrid) return;
  swarmsGrid.innerHTML = `
    <article class="status-hero ${status.apiKeyConfigured ? "live" : "ready"}">
      <span>Swarms Submission</span>
      <h2>${status.apiKeyConfigured ? "Ready" : "API Key Needed"}</h2>
      <p>${status.endpoint}</p>
    </article>
    <article>
      <span>What Users Get</span>
      <h2>MemoryAlpha</h2>
      <p>${status.listing.description}</p>
    </article>
    <article>
      <span>Safety Position</span>
      <h2>Risk-Gated</h2>
      <p>${status.disclosure}</p>
    </article>
    <article>
      <span>Use Cases</span>
      <h2>${status.listing.useCases.length}</h2>
      <p>${status.listing.useCases.map((item) => item.title).join(" · ")}</p>
    </article>
  `;
  if (swarmsPayload) swarmsPayload.textContent = JSON.stringify(status.listing, null, 2);
}

function renderStatus(status) {
  if (!statusGrid) return;
  statusGrid.innerHTML = `
    <article class="status-hero ${status.ok ? "live" : "blocked"}">
      <span>Platform</span>
      <h2>${status.ok ? "Operational" : "Needs Attention"}</h2>
      <p>Updated ${new Date(status.generatedAt).toLocaleString()}</p>
    </article>
    ${status.modules
      .map(
        (module) => `
          <article class="${module.status}">
            <span>${module.status}</span>
            <h2>${module.name}</h2>
            <p>${module.detail}</p>
            <small>${module.evidence}</small>
          </article>
        `
      )
      .join("")}
  `;
}

function renderIntegrationStatus(status, intents) {
  if (!integrationGrid) return;
  integrationGrid.innerHTML = `
    <article class="status-hero ${status.authenticatedTradingConfigured ? "live" : "ready"}">
      <span>${status.track}</span>
      <h2>Bitget Alignment</h2>
      <p>Updated ${new Date(status.generatedAt).toLocaleString()}</p>
    </article>
    ${status.modules
      .map(
        (module) => `
          <article class="${module.status}">
            <span>${module.status}</span>
            <h2>${module.name}</h2>
            <p>${module.detail}</p>
            <small>${module.evidence}</small>
          </article>
        `
      )
      .join("")}
  `;
  if (!intentBoard) return;
  intentBoard.innerHTML = intents.length
    ? intents
        .map(
          (intent) => `
            <article>
              <span>${intent.agentName} · ${intent.symbol}</span>
              <h2>${intent.orderType} ${intent.side}</h2>
              <p>${intent.adapter} · ${intent.riskGate} · ${intent.productType}</p>
              <small>${JSON.stringify(intent.payload)}</small>
            </article>
          `
        )
        .join("")
    : `<article><span>Execution Intents</span><h2>No allow trade intents</h2><p>Run the decision simulator until a packet passes risk and action quality.</p></article>`;
}

function renderAgents(agents) {
  if (!agentRoster) return;
  agentRoster.innerHTML = agents
    .map((agent) => {
      const initials = agent.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2);
      const score = agent.averageScore ? `${agent.averageScore} average score` : "no score yet";
      return `
        <article>
          <div class="agent-badge">${initials}</div>
          <h2>${agent.name}</h2>
          <p>${agent.focus}</p>
          <span>${agent.packets} packets · ${score}</span>
          <a class="inline-link" href="agent.html?id=${encodeURIComponent(agent.id)}">Open vault</a>
        </article>
      `;
    })
    .join("");
}

function memoryList(items, emptyText) {
  if (!items.length) return `<p>${emptyText}</p>`;
  return items
    .map(
      (memory) => `
        <article>
          <span>${memory.symbol} · ${memory.granularity} · ${memory.source}</span>
          <h2>${memory.regime}</h2>
          <p>${memory.thesis}</p>
          <small>score ${memory.score} · outcome ${pct(memory.outcomePct)} · drawdown ${pct(memory.maxDrawdownPct)}</small>
          <a class="inline-link" href="packet.html?id=${encodeURIComponent(memory.id)}">Inspect packet</a>
        </article>
      `
    )
    .join("");
}

function renderAgentVault(agent) {
  if (!agentVault) return;
  agentVault.innerHTML = `
    <p class="eyebrow">Agent Vault</p>
    <div class="agent-vault-head">
      <div>
        <h1>${agent.name}</h1>
        <p class="hero-text">${agent.focus}</p>
      </div>
      <div class="agent-badge vault-badge">${agent.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)}</div>
    </div>
    <div class="vault-columns">
      <section>
        <h2>Published Memories</h2>
        <div class="listing-board">${memoryList(agent.published, "No published memories yet.")}</div>
      </section>
      <section>
        <h2>Imported Memories</h2>
        <div class="listing-board">${memoryList(agent.imported, "No imported memories yet.")}</div>
      </section>
    </div>
  `;
}

function renderDashboard(memories, decisions = []) {
  if (!topScore || !packetCount || !decisionLog) return;
  const selectedSymbol = symbolSelect?.value || "";
  const selectedMemories = selectedSymbol ? memories.filter((memory) => memory.symbol === selectedSymbol) : [];
  const scopedMemories = selectedSymbol ? selectedMemories : memories;
  const latestSelected = selectedMemories.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
  const newest = [...scopedMemories].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
  const focusMemory = latestSelected || newest;
  const selectedDecisions = selectedSymbol ? decisions.filter((decision) => decision.symbol === selectedSymbol) : [];
  packetCount.textContent = scopedMemories.length;
  topScore.textContent = focusMemory ? focusMemory.score : 0;
  topScoreLabel.textContent = focusMemory ? `${focusMemory.symbol} · ${focusMemory.regime}` : `No ${selectedSymbol || ""} packets yet`.trim();
  decisionLog.innerHTML = selectedDecisions.length
    ? selectedDecisions
        .slice(0, 5)
        .map((decision) => `<p>${decision.agentName} returned ${decision.action} for ${decision.symbol} ${decision.regime} memory.</p>`)
        .join("")
    : scopedMemories.length
      ? scopedMemories
          .slice(0, 5)
          .map((memory) => `<p>${memory.agentName} published ${memory.symbol} ${memory.regime} memory at score ${memory.score}.</p>`)
          .join("")
      : `<p>No ${selectedSymbol || "live"} memory packets created yet.</p>`;
}

function renderExecutionSummary(executions) {
  if (!executionCount || !executionPnl) return;
  const selectedSymbol = symbolSelect?.value || "";
  const scopedExecutions = selectedSymbol ? executions.filter((execution) => execution.symbol === selectedSymbol) : executions;
  executionCount.textContent = scopedExecutions.length;
  const realized = scopedExecutions
    .filter((execution) => execution.status === "closed")
    .reduce((sum, execution) => sum + Number(execution.pnl || 0), 0);
  executionPnl.textContent = scopedExecutions.length ? `${selectedSymbol || "All"} realized PnL ${realized.toFixed(2)}` : `No ${selectedSymbol || ""} ledger entries`.trim();
}

async function refreshData() {
  const [memories, agents, decisions, executions] = await Promise.all([
    api("/api/memories"),
    api("/api/agents"),
    api("/api/decisions"),
    api("/api/executions"),
  ]);
  renderMarketplace(memories);
  renderAgents(agents);
  dashboardMemories = memories;
  dashboardDecisions = decisions;
  dashboardExecutions = executions;
  renderDashboard(memories, decisions);
  renderExecutions(executions);
  renderExecutionSummary(executions);
  if (decisionMemory) {
    decisionMemory.innerHTML = memories.length
      ? memories.map((memory) => `<option value="${memory.id}">${memory.symbol} · ${memory.regime} · ${memory.score}</option>`).join("")
      : `<option value="">No packets available</option>`;
    const selected = new URLSearchParams(window.location.search).get("memoryId");
    if (selected) decisionMemory.value = selected;
    const decisionButton = decisionForm?.querySelector("button[type='submit']");
    if (decisionButton) decisionButton.disabled = !memories.length;
    if (!memories.length && decisionResult) {
      decisionResult.innerHTML = `<span>Action</span><h2>No packets</h2><p>Harvest live market memory before simulating decisions.</p><a class="inline-link" href="dashboard.html">Open dashboard</a>`;
    }
  }
  if (executionDecision) {
    const eligible = decisions.filter((decision) => decision.action === "allow trade");
    executionDecision.innerHTML = eligible.length
      ? eligible.map((decision) => `<option value="${decision.id}">${decision.agentName} · ${decision.symbol} · ${decision.action}</option>`).join("")
      : `<option value="">No executable decisions</option>`;
    const executionButton = executionForm?.querySelector("button[type='submit']");
    if (executionButton) executionButton.disabled = !eligible.length;
    if (!eligible.length && executionBoard) {
      executionBoard.innerHTML = `<article><span>Ledger</span><h2>No executable decisions</h2><p>Run the decision simulator until a packet earns an allow trade action.</p><a class="inline-link" href="decision.html">Open decision simulator</a></article>`;
    }
  }
}

symbolSelect?.addEventListener("change", () => {
  renderDashboard(dashboardMemories, dashboardDecisions);
  renderExecutionSummary(dashboardExecutions);
});

async function loadSymbols() {
  if (!symbolSelect && !marketSymbolFilter) return;
  try {
    const symbols = await api("/api/symbols");
    const options = symbols.map((item) => `<option value="${item.symbol}">${item.symbol} · ${item.name}</option>`).join("");
    if (symbolSelect) {
      const current = symbolSelect.value;
      symbolSelect.innerHTML = options;
      if (symbols.some((item) => item.symbol === current)) symbolSelect.value = current;
    }
    if (marketSymbolFilter) {
      const current = marketSymbolFilter.value;
      marketSymbolFilter.innerHTML = `<option value="">All assets</option>${options}`;
      if (symbols.some((item) => item.symbol === current)) marketSymbolFilter.value = current;
    }
  } catch (error) {
    if (harvestStatus) harvestStatus.textContent = error.message;
  }
}

async function loadMarketCoverage() {
  if (!marketCoverage) return;
  try {
    renderMarketCoverage(await api("/api/market/summary?limit=10"));
  } catch (error) {
    marketCoverage.innerHTML = `<article><span>Live Coverage</span><strong>Unavailable</strong><p>${error.message}</p></article>`;
  }
}

async function loadPortfolio() {
  if (!portfolioGrid) return;
  try {
    renderPortfolio(await api("/api/portfolio"));
  } catch (error) {
    portfolioGrid.innerHTML = `<article><span>Status</span><h2>Error</h2><p>${error.message}</p></article>`;
  }
}

async function loadSimulationResults() {
  if (!simulationGrid) return;
  try {
    renderSimulationResults(await api("/api/simulations/results"));
  } catch (error) {
    simulationGrid.innerHTML = `<article><span>Simulation</span><h2>Error</h2><p>${error.message}</p></article>`;
  }
}

async function loadAgentEvaluation() {
  if (!evaluationGrid) return;
  try {
    renderAgentEvaluation(await api("/api/agents/evaluation"));
  } catch (error) {
    evaluationGrid.innerHTML = `<article><span>Evaluation</span><h2>Error</h2><p>${error.message}</p></article>`;
  }
}

async function loadSwarmsStatus() {
  if (!swarmsGrid) return;
  try {
    renderSwarmsStatus(await api("/api/integrations/swarms"));
  } catch (error) {
    swarmsGrid.innerHTML = `<article><span>Swarms</span><h2>Error</h2><p>${error.message}</p></article>`;
  }
}

async function loadStatus() {
  if (!statusGrid) return;
  try {
    renderStatus(await api("/api/status"));
  } catch (error) {
    statusGrid.innerHTML = `<article><span>Status</span><h2>Error</h2><p>${error.message}</p></article>`;
  }
}

async function loadIntegrationStatus() {
  if (!integrationGrid) return;
  try {
    const [status, intents] = await Promise.all([
      api("/api/integrations/bitget"),
      api("/api/integrations/bitget/intents"),
    ]);
    renderIntegrationStatus(status, intents);
  } catch (error) {
    integrationGrid.innerHTML = `<article><span>Integration</span><h2>Error</h2><p>${error.message}</p></article>`;
  }
}

async function loadPacketDetail() {
  if (!packetDetail) return;
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    packetDetail.innerHTML = `<p class="eyebrow">Memory Packet</p><h1>No packet selected.</h1><p class="hero-text">Open a packet from the marketplace.</p>`;
    return;
  }
  try {
    renderPacketDetail(await api(`/api/memories/${encodeURIComponent(id)}`));
  } catch (error) {
    packetDetail.innerHTML = `<p class="eyebrow">Memory Packet</p><h1>Packet unavailable.</h1><p class="hero-text">${error.message}</p>`;
  }
}

async function loadAgentVault() {
  if (!agentVault) return;
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    agentVault.innerHTML = `<p class="eyebrow">Agent Vault</p><h1>No agent selected.</h1><p class="hero-text">Open an agent from the Agents page.</p>`;
    return;
  }
  try {
    renderAgentVault(await api(`/api/agents/${encodeURIComponent(id)}`));
  } catch (error) {
    agentVault.innerHTML = `<p class="eyebrow">Agent Vault</p><h1>Agent unavailable.</h1><p class="hero-text">${error.message}</p>`;
  }
}

harvestForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(harvestForm);
  const body = Object.fromEntries(form.entries());
  if (symbolSelect) body.symbol = symbolSelect.value;
  body.limit = Number(body.limit || 100);
  harvestStatus.textContent = "Harvesting live Bitget candles...";
  try {
    const memory = await api("/api/memories/harvest", {
      method: "POST",
      body: JSON.stringify(body),
    });
    harvestStatus.textContent = `Created ${memory.symbol} ${memory.regime} memory with score ${memory.score}.`;
    await refreshData();
  } catch (error) {
    harvestStatus.textContent = error.message;
  }
});

harvestWatchlist?.addEventListener("click", async () => {
  const form = new FormData(harvestForm);
  const body = Object.fromEntries(form.entries());
  body.limit = Number(body.limit || 80);
  body.max = 10;
  harvestStatus.textContent = "Harvesting watchlist from live Bitget candles...";
  try {
    const result = await api("/api/memories/harvest-watchlist", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const created = result.created.map((memory) => memory.symbol).join(", ") || "none";
    const failed = result.failed.map((item) => item.symbol).join(", ") || "none";
    harvestStatus.textContent = `Created ${result.created.length}: ${created}. Failed ${result.failed.length}: ${failed}.`;
    await refreshData();
  } catch (error) {
    harvestStatus.textContent = error.message;
  }
});

riskForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(riskForm).entries());
  Object.keys(body).forEach((key) => {
    body[key] = Number(body[key]);
  });
  try {
    renderRisk(await api("/api/risk/evaluate", { method: "POST", body: JSON.stringify(body) }));
  } catch (error) {
    riskResult.innerHTML = `<span>Status</span><h2>error</h2><p>${error.message}</p>`;
  }
});

decisionForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(decisionForm).entries());
  ["accountEquity", "positionNotional", "leverage", "stopLossPct", "maxPositionPct", "maxLeverage", "maxLossPct"].forEach((key) => {
    body[key] = Number(body[key]);
  });
  try {
    renderDecision(await api("/api/decisions/simulate", { method: "POST", body: JSON.stringify(body) }));
  } catch (error) {
    decisionResult.innerHTML = `<span>Action</span><h2>error</h2><p>${error.message}</p>`;
  }
});

executionForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(executionForm).entries());
  ["entryPrice", "stopPrice", "size"].forEach((key) => {
    body[key] = Number(body[key]);
  });
  try {
    await api("/api/executions", { method: "POST", body: JSON.stringify(body) });
    await refreshData();
  } catch (error) {
    executionBoard.innerHTML = `<article><span>Ledger</span><h2>Error</h2><p>${error.message}</p></article>`;
  }
});

executionBoard?.addEventListener("submit", async (event) => {
  const form = event.target.closest(".close-execution-form");
  if (!form) return;
  event.preventDefault();
  const body = Object.fromEntries(new FormData(form).entries());
  body.executionId = form.dataset.id;
  body.exitPrice = Number(body.exitPrice);
  try {
    await api("/api/executions/close", { method: "POST", body: JSON.stringify(body) });
    await refreshData();
  } catch (error) {
    executionBoard.insertAdjacentHTML("afterbegin", `<article><span>Ledger</span><h2>Error</h2><p>${error.message}</p></article>`);
  }
});

marketSymbolFilter?.addEventListener("change", () => renderMarketplace(marketplaceMemories));
marketRegimeFilter?.addEventListener("change", () => renderMarketplace(marketplaceMemories));
marketSort?.addEventListener("change", () => renderMarketplace(marketplaceMemories));

if (riskForm) {
  const score = new URLSearchParams(window.location.search).get("score");
  if (score) riskForm.elements.memoryScore.value = score;
}

refreshData().catch((error) => {
  if (harvestStatus) harvestStatus.textContent = error.message;
});
loadSymbols();
loadMarketCoverage();
loadPacketDetail();
loadAgentVault();
loadPortfolio();
loadSimulationResults();
loadAgentEvaluation();
loadSwarmsStatus();
loadStatus();
loadIntegrationStatus();

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
drawDepthWaves();
