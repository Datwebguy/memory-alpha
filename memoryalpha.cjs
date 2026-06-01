const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const root = __dirname;
const seedDataDir = path.join(root, "data");
const dataDir = process.env.MEMORYALPHA_DATA_DIR || (process.env.VERCEL ? path.join("/tmp", "memoryalpha-data") : seedDataDir);
const memoryFile = path.join(dataDir, "memories.json");
const importFile = path.join(dataDir, "imports.json");
const decisionFile = path.join(dataDir, "decisions.json");
const executionFile = path.join(dataDir, "executions.json");
const startPort = Number(process.env.PORT || 4173);
const bitgetBaseUrl = process.env.BITGET_BASE_URL || "https://api.bitget.com";
const agentHubMcpUrl = process.env.BITGET_AGENT_HUB_MCP_URL || "";
const bitgetApiKey = process.env.BITGET_API_KEY || "";
const swarmsApiKey = process.env.SWARMS_API_KEY || "";
const swarmsAddAgentUrl = process.env.SWARMS_ADD_AGENT_URL || "https://swarms.world/api/add-agent";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

const agents = [
  {
    id: "risk-warden",
    name: "Risk Warden",
    focus: "Drawdown control, liquidation avoidance, and crowded-market defense.",
  },
  {
    id: "momentum-hunter",
    name: "Momentum Hunter",
    focus: "Breakout continuation, volume confirmation, and trend persistence.",
  },
  {
    id: "liquidity-scout",
    name: "Liquidity Scout",
    focus: "Order-book depth, slippage risk, and liquidity gaps before execution.",
  },
];

const watchlist = [
  { symbol: "BTCUSDT", name: "Bitcoin" },
  { symbol: "ETHUSDT", name: "Ethereum" },
  { symbol: "SOLUSDT", name: "Solana" },
  { symbol: "XRPUSDT", name: "XRP" },
  { symbol: "BGBUSDT", name: "Bitget Token" },
  { symbol: "DOGEUSDT", name: "Dogecoin" },
  { symbol: "TONUSDT", name: "Toncoin" },
  { symbol: "LINKUSDT", name: "Chainlink" },
  { symbol: "AVAXUSDT", name: "Avalanche" },
  { symbol: "SUIUSDT", name: "Sui" },
];
const supportedSymbols = new Set(watchlist.map((item) => item.symbol));

function normalizeSymbol(symbol) {
  const safeSymbol = String(symbol || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!safeSymbol) throw new Error("Symbol is required");
  if (!supportedSymbols.has(safeSymbol)) throw new Error(`Unsupported symbol ${safeSymbol}`);
  return safeSymbol;
}

function ensureDataFile() {
  fs.mkdirSync(dataDir, { recursive: true });
  [
    [memoryFile, path.join(seedDataDir, "memories.json")],
    [importFile, path.join(seedDataDir, "imports.json")],
    [decisionFile, path.join(seedDataDir, "decisions.json")],
    [executionFile, path.join(seedDataDir, "executions.json")],
  ].forEach(([target, seed]) => {
    if (fs.existsSync(target)) return;
    fs.writeFileSync(target, fs.existsSync(seed) ? fs.readFileSync(seed, "utf8") : "[]\n");
  });
}

function readMemories() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(memoryFile, "utf8")).map(normalizeMemory);
}

function readImports() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(importFile, "utf8"));
}

function writeImports(imports) {
  ensureDataFile();
  fs.writeFileSync(importFile, `${JSON.stringify(imports, null, 2)}\n`);
}

function readDecisions() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(decisionFile, "utf8"));
}

function writeDecisions(decisions) {
  ensureDataFile();
  fs.writeFileSync(decisionFile, `${JSON.stringify(decisions, null, 2)}\n`);
}

function readExecutions() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(executionFile, "utf8"));
}

function writeExecutions(executions) {
  ensureDataFile();
  fs.writeFileSync(executionFile, `${JSON.stringify(executions, null, 2)}\n`);
}

function writeMemories(memories) {
  ensureDataFile();
  fs.writeFileSync(memoryFile, `${JSON.stringify(memories, null, 2)}\n`);
}

function normalizeMemory(memory) {
  if (memory.scoreBreakdown) return memory;
  const outcome = Math.round(Math.max(0, Math.min(30, Math.abs(memory.outcomePct || 0) * 3)));
  const drawdownControl = Math.round(Math.max(0, Math.min(25, 25 - Math.abs(memory.maxDrawdownPct || 0) * 1.6)));
  const volatilitySignal = Math.round(Math.max(0, Math.min(20, (memory.avgMovePct || 0) * 6)));
  const regimeClarity = Math.round(
    {
      "clean-uptrend": 18,
      "volatile-uptrend": 14,
      drawdown: 16,
      "high-volatility-range": 12,
      range: 8,
    }[memory.regime] || 8
  );
  const evidenceDepth = 4;
  return {
    ...memory,
    scoreBreakdown: { outcome, drawdownControl, volatilitySignal, regimeClarity, evidenceDepth },
  };
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "MemoryAlpha/0.1" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    });
    req.setTimeout(15000, () => req.destroy(new Error("Bitget request timed out")));
    req.on("error", reject);
  });
}

function postJsonExternal(url, payload, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const target = new URL(url);
    const req = https.request(
      target,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          Authorization: `Bearer ${token}`,
          "User-Agent": "MemoryAlpha/0.1",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const payload = data ? JSON.parse(data) : {};
            if (res.statusCode < 200 || res.statusCode >= 300) {
              reject(new Error(payload.error || payload.message || `Swarms returned ${res.statusCode}`));
              return;
            }
            resolve(payload);
          } catch (error) {
            reject(error);
          }
        });
      }
    );
    req.setTimeout(15000, () => req.destroy(new Error("Swarms request timed out")));
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function fetchCandles(symbol, granularity, limit) {
  const safeSymbol = normalizeSymbol(symbol);
  const safeGranularity = String(granularity || "1h").replace(/[^A-Za-z0-9]/g, "");
  const safeLimit = Math.max(20, Math.min(Number(limit || 100), 200));
  const url = `${bitgetBaseUrl}/api/v2/spot/market/candles?symbol=${safeSymbol}&granularity=${safeGranularity}&limit=${safeLimit}`;
  const payload = await requestJson(url);

  if (payload.code !== "00000") {
    throw new Error(payload.msg || "Bitget returned an error");
  }

  return payload.data
    .map((item) => ({
      timestamp: Number(item[0]),
      open: Number(item[1]),
      high: Number(item[2]),
      low: Number(item[3]),
      close: Number(item[4]),
      baseVolume: Number(item[5] || 0),
      quoteVolume: Number(item[6] || 0),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

async function marketSummary(symbols = watchlist.slice(0, 8)) {
  const rows = await Promise.all(
    symbols.map(async (asset) => {
      try {
        const candles = await fetchCandles(asset.symbol, "1h", 24);
        if (!candles.length) return null;
        const first = candles[0];
        const last = candles[candles.length - 1];
        const changePct = ((last.close - first.close) / first.close) * 100;
        const quoteVolume = candles.reduce((sum, candle) => sum + Number(candle.quoteVolume || 0), 0);
        const analysis = analyzeCandles(candles);
        return {
          symbol: asset.symbol,
          name: asset.name,
          price: last.close,
          changePct,
          quoteVolume,
          regime: analysis.regime,
          score: analysis.score,
          updatedAt: new Date(last.timestamp).toISOString(),
        };
      } catch {
        return null;
      }
    })
  );
  return rows.filter(Boolean).sort((a, b) => b.score - a.score);
}

function analyzeCandles(candles) {
  const first = candles[0];
  const last = candles[candles.length - 1];
  const outcomePct = ((last.close - first.close) / first.close) * 100;
  let peak = first.close;
  let maxDrawdownPct = 0;
  let totalAbsMove = 0;

  for (let index = 1; index < candles.length; index += 1) {
    peak = Math.max(peak, candles[index].high);
    maxDrawdownPct = Math.min(maxDrawdownPct, ((candles[index].low - peak) / peak) * 100);
    totalAbsMove += Math.abs((candles[index].close - candles[index - 1].close) / candles[index - 1].close);
  }

  const avgMovePct = (totalAbsMove / Math.max(candles.length - 1, 1)) * 100;
  let regime = "range";
  if (outcomePct >= 4 && maxDrawdownPct > -6) regime = "clean-uptrend";
  else if (outcomePct >= 4) regime = "volatile-uptrend";
  else if (outcomePct <= -4 && maxDrawdownPct <= -8) regime = "drawdown";
  else if (avgMovePct >= 1.2) regime = "high-volatility-range";

  const outcomeScore = Math.round(Math.max(0, Math.min(30, Math.abs(outcomePct) * 3)));
  const drawdownScore = Math.round(Math.max(0, Math.min(25, 25 - Math.abs(maxDrawdownPct) * 1.6)));
  const volatilityScore = Math.round(Math.max(0, Math.min(20, avgMovePct * 6)));
  const regimeScore = Math.round(
    {
      "clean-uptrend": 18,
      "volatile-uptrend": 14,
      drawdown: 16,
      "high-volatility-range": 12,
      range: 8,
    }[regime]
  );
  const evidenceScore = Math.round(Math.max(0, Math.min(7, candles.length / 30)));
  const score = Math.round(Math.max(0, Math.min(100, outcomeScore + drawdownScore + volatilityScore + regimeScore + evidenceScore)));

  return {
    regime,
    score,
    scoreBreakdown: {
      outcome: outcomeScore,
      drawdownControl: drawdownScore,
      volatilitySignal: volatilityScore,
      regimeClarity: regimeScore,
      evidenceDepth: evidenceScore,
    },
    outcomePct,
    maxDrawdownPct,
    avgMovePct,
    priceStart: first.close,
    priceEnd: last.close,
    observedFrom: first.timestamp,
    observedTo: last.timestamp,
  };
}

function buildThesis(symbol, granularity, analysis) {
  const posture = {
    "clean-uptrend": "momentum continuation is favored while invalidation remains tight",
    "volatile-uptrend": "continuation is possible, but size should be reduced until volatility compresses",
    drawdown: "new long exposure should be restricted until structure repairs",
    "high-volatility-range": "mean reversion and false breaks require smaller sizing and confirmation",
    range: "directional edge is limited until price leaves the current range",
  }[analysis.regime];

  return `${symbol} on ${granularity} formed a ${analysis.regime} memory with ${analysis.outcomePct.toFixed(
    2
  )}% outcome and ${analysis.maxDrawdownPct.toFixed(2)}% max drawdown; ${posture}.`;
}

function evaluateRisk(body) {
  const accountEquity = Math.max(0, Number(body.accountEquity || 0));
  const positionNotional = Math.max(0, Number(body.positionNotional || 0));
  const leverage = Math.max(1, Number(body.leverage || 1));
  const stopLossPct = Math.max(0, Number(body.stopLossPct || 0));
  const memoryScore = Math.max(0, Math.min(100, Number(body.memoryScore || 0)));
  const maxPositionPct = Math.max(1, Number(body.maxPositionPct || 20));
  const maxLeverage = Math.max(1, Number(body.maxLeverage || 3));
  const maxLossPct = Math.max(0.1, Number(body.maxLossPct || 2));

  const exposurePct = accountEquity > 0 ? (positionNotional / accountEquity) * 100 : 100;
  const lossAtStopPct = accountEquity > 0 ? ((positionNotional * (stopLossPct / 100)) / accountEquity) * 100 : 100;
  const checks = [
    {
      name: "Memory quality",
      pass: memoryScore >= 60,
      detail: `Score ${memoryScore}; minimum 60.`,
    },
    {
      name: "Exposure limit",
      pass: exposurePct <= maxPositionPct,
      detail: `${exposurePct.toFixed(2)}% exposure; limit ${maxPositionPct.toFixed(2)}%.`,
    },
    {
      name: "Leverage limit",
      pass: leverage <= maxLeverage,
      detail: `${leverage.toFixed(2)}x leverage; limit ${maxLeverage.toFixed(2)}x.`,
    },
    {
      name: "Stop-loss risk",
      pass: lossAtStopPct <= maxLossPct,
      detail: `${lossAtStopPct.toFixed(2)}% equity at stop; limit ${maxLossPct.toFixed(2)}%.`,
    },
  ];
  const allowed = checks.every((check) => check.pass);
  return {
    allowed,
    decision: allowed ? "approved" : "blocked",
    exposurePct,
    lossAtStopPct,
    checks,
  };
}

function simulateDecision(body) {
  const memories = readMemories();
  const memory = memories.find((item) => item.id === body.memoryId);
  const agent = agents.find((item) => item.id === body.agentId);
  if (!memory) throw new Error("Memory packet not found");
  if (!agent) throw new Error("Agent not found");

  const risk = evaluateRisk({
    memoryScore: memory.score,
    accountEquity: body.accountEquity,
    positionNotional: body.positionNotional,
    leverage: body.leverage,
    stopLossPct: body.stopLossPct,
    maxPositionPct: body.maxPositionPct,
    maxLeverage: body.maxLeverage,
    maxLossPct: body.maxLossPct,
  });

  let action = "watch";
  if (!risk.allowed) action = "blocked";
  else if (memory.regime === "drawdown") action = "reduce";
  else if (memory.score >= 75 && ["clean-uptrend", "volatile-uptrend"].includes(memory.regime)) action = "allow trade";
  else if (memory.score >= 60) action = "hold";

  const rationale = {
    blocked: "Risk policy rejected the action before execution.",
    reduce: "Memory identifies drawdown conditions; reduce or avoid exposure.",
    "allow trade": "Memory score and regime support a controlled trade within risk limits.",
    hold: "Memory is useful, but regime quality does not justify immediate execution.",
    watch: "Signal quality is not strong enough for action.",
  }[action];

  const decision = {
    id: `${Date.now()}:${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    agentId: agent.id,
    agentName: agent.name,
    memoryId: memory.id,
    symbol: memory.symbol,
    regime: memory.regime,
    score: memory.score,
    action,
    rationale,
    risk,
  };

  writeDecisions([decision, ...readDecisions()].slice(0, 100));
  return decision;
}

function createExecution(body) {
  const decisions = readDecisions();
  const decision = decisions.find((item) => item.id === body.decisionId);
  if (!decision) throw new Error("Decision not found");
  if (decision.action !== "allow trade") {
    throw new Error(`Cannot open execution for ${decision.action} decision`);
  }

  const entryPrice = Math.max(0, Number(body.entryPrice || 0));
  const stopPrice = Math.max(0, Number(body.stopPrice || 0));
  const size = Math.max(0, Number(body.size || 0));
  if (!entryPrice || !stopPrice || !size) throw new Error("Entry price, stop price, and size are required");

  const side = body.side === "short" ? "short" : "long";
  const riskPerUnit = side === "long" ? entryPrice - stopPrice : stopPrice - entryPrice;
  if (riskPerUnit <= 0) throw new Error("Stop price must define positive risk for the selected side");

  const execution = {
    id: `${Date.now()}:${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    status: "open",
    decisionId: decision.id,
    agentId: decision.agentId,
    agentName: decision.agentName,
    memoryId: decision.memoryId,
    symbol: decision.symbol,
    regime: decision.regime,
    action: decision.action,
    side,
    entryPrice,
    stopPrice,
    size,
    riskAmount: Number((riskPerUnit * size).toFixed(4)),
    exitPrice: null,
    pnl: null,
    closedAt: null,
  };
  writeExecutions([execution, ...readExecutions()]);
  return execution;
}

function closeExecution(body) {
  const executionId = body.executionId;
  const exitPrice = Math.max(0, Number(body.exitPrice || 0));
  if (!exitPrice) throw new Error("Exit price is required");

  let updated;
  const executions = readExecutions().map((execution) => {
    if (execution.id !== executionId) return execution;
    const pnl =
      execution.side === "long"
        ? (exitPrice - execution.entryPrice) * execution.size
        : (execution.entryPrice - exitPrice) * execution.size;
    updated = {
      ...execution,
      status: "closed",
      exitPrice,
      pnl: Number(pnl.toFixed(4)),
      closedAt: new Date().toISOString(),
    };
    return updated;
  });
  if (!updated) throw new Error("Execution not found");
  writeExecutions(executions);
  return updated;
}

function buildPortfolio() {
  const memories = readMemories();
  const decisions = readDecisions();
  const executions = readExecutions();
  const closed = executions.filter((execution) => execution.status === "closed");
  const open = executions.filter((execution) => execution.status === "open");
  const realizedPnl = closed.reduce((sum, execution) => sum + Number(execution.pnl || 0), 0);
  const openRisk = open.reduce((sum, execution) => sum + Number(execution.riskAmount || 0), 0);
  const wins = closed.filter((execution) => Number(execution.pnl || 0) > 0).length;
  const losses = closed.filter((execution) => Number(execution.pnl || 0) < 0).length;
  const winRate = closed.length ? (wins / closed.length) * 100 : 0;
  const bestMemory = [...memories].sort((a, b) => b.score - a.score)[0] || null;

  const byAgent = agents.map((agent) => {
    const agentMemories = memories.filter((memory) => memory.agentId === agent.id);
    const agentDecisions = decisions.filter((decision) => decision.agentId === agent.id);
    const agentExecutions = executions.filter((execution) => execution.agentId === agent.id);
    const agentClosed = agentExecutions.filter((execution) => execution.status === "closed");
    const pnl = agentClosed.reduce((sum, execution) => sum + Number(execution.pnl || 0), 0);
    return {
      id: agent.id,
      name: agent.name,
      memories: agentMemories.length,
      decisions: agentDecisions.length,
      executions: agentExecutions.length,
      realizedPnl: Number(pnl.toFixed(4)),
      averageMemoryScore: agentMemories.length
        ? Math.round(agentMemories.reduce((sum, memory) => sum + Number(memory.score || 0), 0) / agentMemories.length)
        : 0,
    };
  });

  return {
    totals: {
      memories: memories.length,
      decisions: decisions.length,
      executions: executions.length,
      openExecutions: open.length,
      closedExecutions: closed.length,
      realizedPnl: Number(realizedPnl.toFixed(4)),
      openRisk: Number(openRisk.toFixed(4)),
      winRate: Number(winRate.toFixed(2)),
      wins,
      losses,
    },
    bestMemory,
    byAgent,
    recentExecutions: executions.slice(0, 8),
    recentDecisions: decisions.slice(0, 8),
  };
}

function buildSimulationResults() {
  const memories = readMemories();
  const decisions = readDecisions();
  const executions = readExecutions();
  const bySymbol = [...new Set(memories.map((memory) => memory.symbol))].sort().map((symbol) => {
    const items = memories.filter((memory) => memory.symbol === symbol);
    const avgScore = items.reduce((sum, memory) => sum + Number(memory.score || 0), 0) / Math.max(items.length, 1);
    const avgOutcome = items.reduce((sum, memory) => sum + Number(memory.outcomePct || 0), 0) / Math.max(items.length, 1);
    const worstDrawdown = Math.min(...items.map((memory) => Number(memory.maxDrawdownPct || 0)));
    return {
      symbol,
      packets: items.length,
      avgScore: Number(avgScore.toFixed(2)),
      avgOutcomePct: Number(avgOutcome.toFixed(2)),
      worstDrawdownPct: Number(worstDrawdown.toFixed(2)),
    };
  });
  const byRegime = [...new Set(memories.map((memory) => memory.regime))].sort().map((regime) => {
    const items = memories.filter((memory) => memory.regime === regime);
    return {
      regime,
      packets: items.length,
      avgScore: Number((items.reduce((sum, memory) => sum + Number(memory.score || 0), 0) / Math.max(items.length, 1)).toFixed(2)),
      avgOutcomePct: Number((items.reduce((sum, memory) => sum + Number(memory.outcomePct || 0), 0) / Math.max(items.length, 1)).toFixed(2)),
    };
  });
  const rankedPackets = [...memories]
    .sort((a, b) => b.score - a.score || Math.abs(b.outcomePct || 0) - Math.abs(a.outcomePct || 0))
    .slice(0, 12)
    .map((memory) => ({
      id: memory.id,
      agentName: memory.agentName,
      symbol: memory.symbol,
      granularity: memory.granularity,
      regime: memory.regime,
      score: memory.score,
      outcomePct: Number(Number(memory.outcomePct || 0).toFixed(2)),
      maxDrawdownPct: Number(Number(memory.maxDrawdownPct || 0).toFixed(2)),
      observedFrom: memory.observedFrom,
      observedTo: memory.observedTo,
    }));
  const actionCounts = decisions.reduce((acc, decision) => {
    acc[decision.action] = (acc[decision.action] || 0) + 1;
    return acc;
  }, {});
  const closedExecutions = executions.filter((execution) => execution.status === "closed");
  const realizedPnl = closedExecutions.reduce((sum, execution) => sum + Number(execution.pnl || 0), 0);

  return {
    generatedAt: new Date().toISOString(),
    sample: {
      packets: memories.length,
      decisions: decisions.length,
      executions: executions.length,
      closedExecutions: closedExecutions.length,
    },
    summary: {
      averageScore: memories.length
        ? Number((memories.reduce((sum, memory) => sum + Number(memory.score || 0), 0) / memories.length).toFixed(2))
        : 0,
      averageOutcomePct: memories.length
        ? Number((memories.reduce((sum, memory) => sum + Number(memory.outcomePct || 0), 0) / memories.length).toFixed(2))
        : 0,
      worstDrawdownPct: memories.length ? Number(Math.min(...memories.map((memory) => Number(memory.maxDrawdownPct || 0))).toFixed(2)) : 0,
      bestPacket: rankedPackets[0] || null,
      actionCounts,
      realizedPnl: Number(realizedPnl.toFixed(4)),
    },
    bySymbol,
    byRegime,
    rankedPackets,
  };
}

function average(items, selector) {
  return items.length ? items.reduce((sum, item) => sum + Number(selector(item) || 0), 0) / items.length : 0;
}

function buildAgentEvaluation() {
  const memories = readMemories();
  const imports = readImports();
  const decisions = readDecisions();
  return {
    generatedAt: new Date().toISOString(),
    agents: agents.map((agent) => {
      const published = memories.filter((memory) => memory.agentId === agent.id);
      const importedEvents = imports.filter((event) => event.agentId === agent.id);
      const imported = importedEvents
        .map((event) => memories.find((memory) => memory.id === event.memoryId))
        .filter(Boolean);
      const combined = [...published, ...imported];
      const publishedSymbols = new Set(published.map((memory) => memory.symbol));
      const importedSymbols = new Set(imported.map((memory) => memory.symbol));
      const publishedRegimes = new Set(published.map((memory) => memory.regime));
      const importedRegimes = new Set(imported.map((memory) => memory.regime));
      const agentDecisions = decisions.filter((decision) => decision.agentId === agent.id);
      const gainedSymbols = [...importedSymbols].filter((symbol) => !publishedSymbols.has(symbol));
      const gainedRegimes = [...importedRegimes].filter((regime) => !publishedRegimes.has(regime));
      const publishedAvgScore = average(published, (memory) => memory.score);
      const importedAvgScore = average(imported, (memory) => memory.score);
      const combinedAvgScore = average(combined, (memory) => memory.score);
      const scoreLift = combinedAvgScore - publishedAvgScore;

      return {
        id: agent.id,
        name: agent.name,
        focus: agent.focus,
        publishedPackets: published.length,
        importedPackets: imported.length,
        combinedPackets: combined.length,
        publishedAvgScore: Number(publishedAvgScore.toFixed(2)),
        importedAvgScore: Number(importedAvgScore.toFixed(2)),
        combinedAvgScore: Number(combinedAvgScore.toFixed(2)),
        scoreLift: Number(scoreLift.toFixed(2)),
        publishedSymbols: publishedSymbols.size,
        importedSymbols: importedSymbols.size,
        combinedSymbols: new Set(combined.map((memory) => memory.symbol)).size,
        gainedSymbols,
        gainedRegimes,
        decisions: agentDecisions.length,
        allowTradeDecisions: agentDecisions.filter((decision) => decision.action === "allow trade").length,
        blockedDecisions: agentDecisions.filter((decision) => decision.action === "blocked").length,
      };
    }),
  };
}

function buildStatus() {
  const memories = readMemories();
  const imports = readImports();
  const decisions = readDecisions();
  const executions = readExecutions();
  const closedExecutions = executions.filter((execution) => execution.status === "closed");
  const modules = [
    {
      name: "Live market adapter",
      status: "live",
      detail: "Bitget spot candle adapter is configured.",
      evidence: bitgetBaseUrl,
    },
    {
      name: "Memory packets",
      status: memories.length ? "live" : "ready",
      detail: `${memories.length} persisted packets.`,
      evidence: "data/memories.json",
    },
    {
      name: "Agent imports",
      status: imports.length ? "live" : "ready",
      detail: `${imports.length} import events.`,
      evidence: "data/imports.json",
    },
    {
      name: "Risk policy",
      status: "live",
      detail: "Exposure, leverage, memory quality, and stop-risk checks available.",
      evidence: "POST /api/risk/evaluate",
    },
    {
      name: "Decision simulator",
      status: decisions.length ? "live" : "ready",
      detail: `${decisions.length} simulated decisions.`,
      evidence: "data/decisions.json",
    },
    {
      name: "Execution ledger",
      status: executions.length ? "live" : "ready",
      detail: `${executions.length} executions; ${closedExecutions.length} closed.`,
      evidence: "data/executions.json",
    },
    {
      name: "Portfolio analytics",
      status: "live",
      detail: "Aggregates memories, decisions, executions, risk, and realized PnL.",
      evidence: "GET /api/portfolio",
    },
    {
      name: "Simulation results",
      status: memories.length ? "live" : "ready",
      detail: "Summarizes packet outcome, drawdown, score, regime, and symbol coverage.",
      evidence: "GET /api/simulations/results",
    },
    {
      name: "Agent evaluation",
      status: imports.length ? "live" : "ready",
      detail: "Compares published memory coverage against imported memory expansion.",
      evidence: "GET /api/agents/evaluation",
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    ok: modules.every((module) => ["live", "ready"].includes(module.status)),
    modules,
  };
}

function buildIntegrationStatus() {
  const executions = readExecutions();
  const decisions = readDecisions();
  const allowTradeDecisions = decisions.filter((decision) => decision.action === "allow trade");
  const modules = [
    {
      name: "Bitget public market data",
      status: "live",
      detail: "Spot candle requests are served by the Bitget REST market endpoint.",
      evidence: `${bitgetBaseUrl}/api/v2/spot/market/candles`,
    },
    {
      name: "Watchlist adapter",
      status: "live",
      detail: `${watchlist.length} supported spot symbols are validated before harvest.`,
      evidence: watchlist.map((item) => item.symbol).join(", "),
    },
    {
      name: "Agent Hub MCP bridge",
      status: agentHubMcpUrl ? "live" : "ready",
      detail: agentHubMcpUrl
        ? "Agent Hub MCP endpoint is configured for downstream tool calls."
        : "Set BITGET_AGENT_HUB_MCP_URL when an Agent Hub MCP endpoint is available.",
      evidence: agentHubMcpUrl || "BITGET_AGENT_HUB_MCP_URL",
    },
    {
      name: "Authenticated trading adapter",
      status: bitgetApiKey ? "live" : "ready",
      detail: bitgetApiKey
        ? "Bitget API key is present for account-scoped endpoints."
        : "Set BITGET_API_KEY for account, order, and private execution endpoints.",
      evidence: bitgetApiKey ? "BITGET_API_KEY present" : "BITGET_API_KEY",
    },
    {
      name: "Execution intent builder",
      status: allowTradeDecisions.length ? "live" : "ready",
      detail: `${allowTradeDecisions.length} allow trade decisions can become Bitget-style order intents.`,
      evidence: "GET /api/integrations/bitget/intents",
    },
    {
      name: "Local execution records",
      status: executions.length ? "live" : "ready",
      detail: `${executions.length} execution records are stored for audit and portfolio analytics.`,
      evidence: "data/executions.json",
    },
  ];

  return {
    track: "Open Innovation + Trading Infra",
    generatedAt: new Date().toISOString(),
    bitgetBaseUrl,
    agentHubMcpConfigured: Boolean(agentHubMcpUrl),
    authenticatedTradingConfigured: Boolean(bitgetApiKey),
    modules,
  };
}

function buildExecutionIntents() {
  return readDecisions()
    .filter((decision) => decision.action === "allow trade")
    .slice(0, 12)
    .map((decision) => ({
      id: `intent:${decision.id}`,
      createdAt: new Date().toISOString(),
      sourceDecisionId: decision.id,
      agentId: decision.agentId,
      agentName: decision.agentName,
      memoryId: decision.memoryId,
      symbol: decision.symbol,
      productType: "spot",
      side: "buy",
      orderType: "market",
      riskGate: decision.risk.decision,
      adapter: "bitget-agent-hub",
      payload: {
        symbol: decision.symbol,
        productType: "spot",
        side: "buy",
        orderType: "market",
        clientOid: `memoryalpha-${decision.id.replace(/[^a-zA-Z0-9]/g, "-")}`,
      },
    }));
}

function buildSwarmsListing() {
  return {
    name: "MemoryAlpha Agent Memory Market",
    agent:
      "MemoryAlpha is an agent-memory and risk-evaluation layer for autonomous trading systems. It harvests live Bitget spot candle windows, converts them into scored memory packets, lets agents import reusable market lessons, evaluates memory-supported actions through risk policy, simulates decisions, produces execution records only for allow trade outcomes, and exposes Bitget-style execution-intent payloads for downstream Agent Hub or exchange API tooling.",
    description:
      "A trading-agent infrastructure agent that helps autonomous agents preserve, exchange, evaluate, and reuse market experience with transparent risk controls.",
    language: "javascript",
    tags: ["trading-agents", "memory", "risk", "bitget", "marketplace", "agent-infra"],
    requirements: [
      "Node.js runtime",
      "Network access to Bitget public spot market data",
      "Optional BITGET_AGENT_HUB_MCP_URL for Agent Hub bridge",
      "Optional BITGET_API_KEY for account-scoped integrations",
    ],
    useCases: [
      {
        title: "Agent memory marketplace",
        description: "Publish and inspect scored memory packets created from live market windows.",
      },
      {
        title: "Trading-agent risk layer",
        description: "Evaluate memory-supported actions against exposure, leverage, memory quality, and stop-loss risk.",
      },
      {
        title: "Agent evaluation",
        description: "Compare published memory against imported memory to measure coverage expansion and score lift.",
      },
      {
        title: "Execution-intent generation",
        description: "Create Bitget-style execution intents after an allow trade decision without implying automatic live trading.",
      },
    ],
    whoShouldUseIt: [
      "Trading-agent builders who need reusable market memory instead of one-off signal logs.",
      "Agent teams that want to compare how imported market experience changes agent coverage.",
      "Risk-focused users who want every agent decision checked before an execution record or execution intent exists.",
      "Hackathon judges or reviewers who need a transparent view of how an agent learned from live market data.",
    ],
    userJourney: [
      "Harvest live Bitget candles into a memory packet.",
      "Inspect the packet thesis, score, outcome, and drawdown.",
      "Import useful memory into another agent vault.",
      "Evaluate risk policy for the memory-supported action.",
      "Simulate the agent decision.",
      "Create an execution record or Bitget-style execution intent only when the result is allow trade.",
      "Review simulation results, portfolio analytics, and agent evaluation.",
    ],
    notFor: [
      "Users expecting guaranteed profit.",
      "Users looking for an automatic live trading bot.",
      "Users who want to bypass risk policy, account permissions, or manual review.",
    ],
  };
}

function buildSwarmsStatus() {
  return {
    endpoint: swarmsAddAgentUrl,
    apiKeyConfigured: Boolean(swarmsApiKey),
    listing: buildSwarmsListing(),
    disclosure:
      "MemoryAlpha provides market-memory infrastructure and risk-gated decision support. It does not promise profit and does not execute trades automatically.",
  };
}





async function harvestMemory(body) {
  const agentId = body.agentId || "risk-warden";
  const symbol = normalizeSymbol(body.symbol);
  const granularity = body.granularity || "1h";
  const candles = await fetchCandles(symbol, granularity, body.limit || 100);

  if (candles.length < 20) throw new Error("Not enough live candle data to create a memory packet");

  const analysis = analyzeCandles(candles);
  const id = `${agentId}:${symbol}:${granularity}:${analysis.observedFrom}:${analysis.observedTo}`;
  const memory = {
    id,
    agentId,
    agentName: agents.find((agent) => agent.id === agentId)?.name || agentId,
    symbol,
    granularity,
    source: "bitget-spot-candles",
    thesis: buildThesis(symbol, granularity, analysis),
    createdAt: new Date().toISOString(),
    imports: 0,
    ...analysis,
  };

  const memories = readMemories();
  const next = [memory, ...memories.filter((item) => item.id !== id)];
  writeMemories(next);
  return memory;
}

async function harvestWatchlist(body) {
  const agentId = body.agentId || "risk-warden";
  const granularity = body.granularity || "1h";
  const limit = Number(body.limit || 80);
  const max = Math.max(1, Math.min(Number(body.max || watchlist.length), watchlist.length));
  const created = [];
  const failed = [];

  for (const item of watchlist.slice(0, max)) {
    try {
      created.push(await harvestMemory({ agentId, symbol: item.symbol, granularity, limit }));
    } catch (error) {
      failed.push({ symbol: item.symbol, error: error.message });
    }
  }

  return { created, failed };
}

async function handleApi(req, res, url) {
  try {
    if (req.method === "OPTIONS") {
      sendJson(res, 204, {});
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true, bitgetBaseUrl, memoryFile });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/agents") {
      const memories = readMemories();
      sendJson(
        res,
        200,
        agents.map((agent) => {
          const owned = memories.filter((memory) => memory.agentId === agent.id);
          const averageScore = owned.length
            ? Math.round(owned.reduce((sum, memory) => sum + memory.score, 0) / owned.length)
            : 0;
          return { ...agent, packets: owned.length, averageScore };
        })
      );
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/agents/evaluation") {
      sendJson(res, 200, buildAgentEvaluation());
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/symbols") {
      sendJson(res, 200, watchlist);
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/agents/")) {
      const id = decodeURIComponent(url.pathname.replace("/api/agents/", ""));
      const agent = agents.find((item) => item.id === id);
      if (!agent) {
        sendJson(res, 404, { error: "Agent not found" });
        return;
      }
      const memories = readMemories();
      const imports = readImports();
      const published = memories.filter((memory) => memory.agentId === id);
      const importedEvents = imports.filter((event) => event.agentId === id);
      const imported = importedEvents
        .map((event) => {
          const memory = memories.find((item) => item.id === event.memoryId);
          return memory ? { ...memory, importedAt: event.createdAt } : null;
        })
        .filter(Boolean);
      sendJson(res, 200, { ...agent, published, imported });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/memories") {
      sendJson(res, 200, readMemories());
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/memories/")) {
      const id = decodeURIComponent(url.pathname.replace("/api/memories/", ""));
      const memory = readMemories().find((item) => item.id === id);
      if (!memory) {
        sendJson(res, 404, { error: "Memory packet not found" });
        return;
      }
      const imports = readImports().filter((item) => item.memoryId === id);
      sendJson(res, 200, { ...memory, importEvents: imports });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/market/candles") {
      const candles = await fetchCandles(
        url.searchParams.get("symbol"),
        url.searchParams.get("granularity"),
        url.searchParams.get("limit")
      );
      sendJson(res, 200, candles);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/market/summary") {
      const max = Math.max(3, Math.min(Number(url.searchParams.get("limit") || 8), watchlist.length));
      sendJson(res, 200, await marketSummary(watchlist.slice(0, max)));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/memories/harvest") {
      const body = await readJson(req);
      sendJson(res, 201, await harvestMemory(body));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/memories/harvest-watchlist") {
      const body = await readJson(req);
      sendJson(res, 201, await harvestWatchlist(body));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/imports") {
      const body = await readJson(req);
      const memoryId = body.memoryId;
      const agentId = body.agentId;
      const memory = readMemories().find((item) => item.id === memoryId);
      const agent = agents.find((item) => item.id === agentId);

      if (!memory) throw new Error("Memory packet not found");
      if (!agent) throw new Error("Importing agent not found");

      const event = {
        id: `${Date.now()}:${Math.random().toString(16).slice(2)}`,
        memoryId,
        agentId,
        agentName: agent.name,
        createdAt: new Date().toISOString(),
      };
      const imports = [event, ...readImports()];
      writeImports(imports);

      const memories = readMemories().map((item) =>
        item.id === memoryId ? { ...item, imports: (item.imports || 0) + 1 } : item
      );
      writeMemories(memories);
      sendJson(res, 201, event);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/risk/evaluate") {
      const body = await readJson(req);
      sendJson(res, 200, evaluateRisk(body));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/decisions") {
      sendJson(res, 200, readDecisions());
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/decisions/simulate") {
      const body = await readJson(req);
      sendJson(res, 201, simulateDecision(body));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/executions") {
      sendJson(res, 200, readExecutions());
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/executions") {
      const body = await readJson(req);
      sendJson(res, 201, createExecution(body));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/executions/close") {
      const body = await readJson(req);
      sendJson(res, 200, closeExecution(body));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/portfolio") {
      sendJson(res, 200, buildPortfolio());
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/simulations/results") {
      sendJson(res, 200, buildSimulationResults());
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/status") {
      sendJson(res, 200, buildStatus());
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/integrations/bitget") {
      sendJson(res, 200, buildIntegrationStatus());
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/integrations/bitget/intents") {
      sendJson(res, 200, buildExecutionIntents());
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/integrations/swarms") {
      sendJson(res, 200, buildSwarmsStatus());
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/integrations/swarms/submit") {
      if (!swarmsApiKey) throw new Error("SWARMS_API_KEY is required to submit the agent listing");
      sendJson(res, 200, await postJsonExternal(swarmsAddAgentUrl, buildSwarmsListing(), swarmsApiKey));
      return;
    }

    sendJson(res, 404, { error: "API route not found" });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}

function serveStatic(req, res, url) {
  const route = decodeURIComponent(url.pathname);
  const filePath = path.resolve(root, route === "/" ? "index.html" : route.slice(1));

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "text/plain",
      "Cache-Control": "no-store",
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  if (url.pathname.startsWith("/api/")) {
    handleApi(req, res, url);
    return;
  }
  serveStatic(req, res, url);
});

function listen(port, attemptsLeft = 10) {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
      listen(port + 1, attemptsLeft - 1);
      return;
    }
    throw error;
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(`MemoryAlpha preview: http://127.0.0.1:${port}/index.html`);
  });
}

if (require.main === module) {
  listen(startPort);
}

module.exports = {
  handleApi,
};
