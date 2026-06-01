# MemoryAlpha

MemoryAlpha is an agent-memory market for autonomous trading systems. It captures completed market lessons as scored memory packets, lets agents import those packets into their vaults, and evaluates memory-supported actions through a risk policy before execution.

## Run

```bat
preview.cmd
```

Open:

```text
http://127.0.0.1:4260/index.html
```

Stop:

```bat
stop-preview.cmd
```

Verify:

```bat
verify.cmd
```

The verifier checks static pages, core APIs, live Bitget candle access, dynamic agent/memory detail routes, and risk evaluation.

## Current Functional Scope

- Live Bitget spot candle adapter.
- Multi-token watchlist with BTC, ETH, SOL, XRP, BGB, DOGE, TON, LINK, AVAX, and SUI.
- Live homepage market coverage across the supported watchlist.
- Bitget integration status for Agent Hub MCP readiness, authenticated API configuration, and execution-intent payloads.
- Swarms submission metadata and API adapter for agent marketplace listing.
- Persistent memory packets in `data/memories.json`.
- Persistent import events in `data/imports.json`.
- Persistent decision simulations in `data/decisions.json`.
- Persistent execution ledger records in `data/executions.json`.
- Agent profiles and agent vaults.
- Packet detail pages with score breakdown.
- Risk policy evaluation.
- Decision simulation: packet + agent + risk policy = final action.
- Simulation results across packet outcome, drawdown, score, regime, symbol, decisions, and execution records.
- Agent evaluation comparing published memory coverage against imported memory expansion.
- Portfolio analytics across memories, decisions, executions, risk, and realized PnL.
- System status page backed by live API/data checks.

## API

- `GET /api/health`
- `GET /api/agents`
- `GET /api/agents/evaluation`
- `GET /api/symbols`
- `GET /api/market/summary?limit=10`
- `GET /api/agents/:id`
- `GET /api/memories`
- `GET /api/memories/:id`
- `GET /api/market/candles?symbol=BTCUSDT&granularity=1h&limit=100`
- `POST /api/memories/harvest`
- `POST /api/imports`
- `POST /api/risk/evaluate`
- `GET /api/decisions`
- `POST /api/decisions/simulate`
- `GET /api/executions`
- `POST /api/executions`
- `POST /api/executions/close`
- `GET /api/portfolio`
- `GET /api/simulations/results`
- `GET /api/status`
- `GET /api/integrations/bitget`
- `GET /api/integrations/bitget/intents`
- `GET /api/integrations/swarms`
- `POST /api/integrations/swarms/submit`

## Main Pages

- `/index.html`
- `/app.html`
- `/dashboard.html`
- `/marketplace.html`
- `/packet.html`
- `/agents.html`
- `/agent.html`
- `/evaluation.html`
- `/decision.html`
- `/executions.html`
- `/portfolio.html`
- `/simulations.html`
- `/integrations.html`
- `/swarms.html`
- `/status.html`
- `/whitepaper.html`
- `/roadmap.html`
- `/faq.html`

## Documents

- `WHITEPAPER.md`
- `ROADMAP.md`

## Product Flow

1. Open `/guide.html` for the full product guide.
2. Open `/app.html` for the feature hub.
3. Harvest live market data into a memory packet from the Dashboard.
4. Inspect the packet from the Marketplace.
5. Import it into an agent vault.
6. Review score breakdown and import history.
7. Evaluate risk policy.
8. Simulate an agent decision.
9. Record and close execution entries in the ledger after an `allow trade` decision.
10. Review simulation results.
11. Compare agent memory coverage before and after imports.
12. Inspect Bitget integration status and execution-intent payloads.
13. Review portfolio analytics.
14. Check system status.
