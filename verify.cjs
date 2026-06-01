const http = require("http");

const port = Number(process.env.PORT || 4260);
const base = `http://127.0.0.1:${port}`;

const checks = [
  ["/api/health", (data) => data.ok === true],
  ["/api/agents", (data) => Array.isArray(data) && data.length >= 3],
  ["/api/agents/evaluation", (data) => Array.isArray(data.agents) && data.agents.length >= 3],
  ["/api/symbols", (data) => Array.isArray(data) && data.length >= 5 && data.some((item) => item.symbol === "ETHUSDT")],
  ["/api/market/summary?limit=5", (data) => Array.isArray(data) && data.length >= 5 && data.every((item) => item.symbol && Number.isFinite(item.price))],
  ["/api/memories", (data) => Array.isArray(data)],
  ["/api/market/candles?symbol=BTCUSDT&granularity=1h&limit=20", (data) => Array.isArray(data) && data.length >= 20 && Number.isFinite(data[0].close)],
  ["/api/market/candles?symbol=ETHUSDT&granularity=1h&limit=20", (data) => Array.isArray(data) && data.length >= 20 && Number.isFinite(data[0].close)],
  ["/api/decisions", (data) => Array.isArray(data)],
  ["/api/executions", (data) => Array.isArray(data)],
  ["/api/portfolio", (data) => Boolean(data.totals)],
  ["/api/simulations/results", (data) => data.sample && data.summary && Array.isArray(data.rankedPackets)],
  ["/api/status", (data) => data.ok === true && Array.isArray(data.modules)],
  ["/api/integrations/bitget", (data) => data.track && Array.isArray(data.modules) && data.modules.some((item) => item.name.includes("Agent Hub"))],
  ["/api/integrations/bitget/intents", (data) => Array.isArray(data)],
  ["/api/integrations/swarms", (data) => data.listing && data.listing.name && Array.isArray(data.listing.useCases)],
];

const pages = [
  "/index.html",
  "/app.html",
  "/guide.html",
  "/about.html",
  "/platform.html",
  "/marketplace.html",
  "/packet.html",
  "/agents.html",
  "/agent.html",
  "/evaluation.html",
  "/dashboard.html",
  "/portfolio.html",
  "/simulations.html",
  "/decision.html",
  "/executions.html",
  "/risk.html",
  "/integrations.html",
  "/swarms.html",
  "/status.html",
  "/whitepaper.html",
  "/roadmap.html",
  "/faq.html",
];

function getJson(path) {
  return new Promise((resolve, reject) => {
    http
      .get(`${base}${path}`, (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`${path} returned ${res.statusCode}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = http.request(
      `${base}${path}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => {
          responseBody += chunk;
        });
        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`${path} returned ${res.statusCode}`));
            return;
          }
          try {
            resolve(JSON.parse(responseBody));
          } catch (error) {
            reject(error);
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function getText(path) {
  return new Promise((resolve, reject) => {
    http
      .get(`${base}${path}`, (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`${path} returned ${res.statusCode}`));
            return;
          }
          resolve(body);
        });
      })
      .on("error", reject);
  });
}

(async () => {
  for (const [path, isValid] of checks) {
    const data = await getJson(path);
    if (!isValid(data)) throw new Error(`${path} failed validation`);
    console.log(`ok ${path}`);
  }
  const agents = await getJson("/api/agents");
  const agent = await getJson(`/api/agents/${encodeURIComponent(agents[0].id)}`);
  if (!agent.id || !Array.isArray(agent.published) || !Array.isArray(agent.imported)) {
    throw new Error("/api/agents/:id failed validation");
  }
  console.log("ok /api/agents/:id");
  const memories = await getJson("/api/memories");
  let firstMemory = null;
  if (memories.length) {
    const memory = await getJson(`/api/memories/${encodeURIComponent(memories[0].id)}`);
    if (!memory.id || !memory.scoreBreakdown) throw new Error("/api/memories/:id failed validation");
    firstMemory = memory;
    console.log("ok /api/memories/:id");
  }
  const risk = await postJson("/api/risk/evaluate", {
    memoryScore: 75,
    accountEquity: 10000,
    positionNotional: 1000,
    leverage: 2,
    stopLossPct: 2,
    maxPositionPct: 20,
    maxLeverage: 3,
    maxLossPct: 2,
  });
  if (risk.decision !== "approved") throw new Error("/api/risk/evaluate failed validation");
  console.log("ok /api/risk/evaluate");
  const solMemory = await postJson("/api/memories/harvest", {
    agentId: "risk-warden",
    symbol: "SOLUSDT",
    granularity: "1h",
    limit: 20,
  });
  if (solMemory.symbol !== "SOLUSDT" || !solMemory.id.includes("SOLUSDT") || !solMemory.thesis.includes("SOLUSDT")) {
    throw new Error("/api/memories/harvest failed SOL symbol validation");
  }
  console.log("ok /api/memories/harvest SOLUSDT");
  for (const page of pages) {
    const html = await getText(page);
    if (!html.includes("MemoryAlpha")) throw new Error(`${page} failed content validation`);
    console.log(`ok ${page}`);
  }
  if (firstMemory) {
    const dynamicPages = [
      `/packet.html?id=${encodeURIComponent(firstMemory.id)}`,
      `/agent.html?id=${encodeURIComponent(agent.id)}`,
      `/decision.html?memoryId=${encodeURIComponent(firstMemory.id)}`,
      `/risk.html?score=${encodeURIComponent(firstMemory.score)}`,
    ];
    for (const page of dynamicPages) {
      const html = await getText(page);
      if (!html.includes("MemoryAlpha")) throw new Error(`${page} failed content validation`);
      console.log(`ok ${page}`);
    }
  }
  console.log(`verified ${base}`);
})().catch((error) => {
  console.error(`verify failed: ${error.message}`);
  process.exit(1);
});
