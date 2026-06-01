# MemoryAlpha

MemoryAlpha is an agent-memory market for autonomous trading systems. It turns live Bitget market windows into scored memory packets that trading agents can publish, inspect, import, evaluate, and use as decision context.

The platform is built around one core idea: an agent should not only react to live signals. It should preserve useful market experience, measure the quality of that experience, and pass every memory-supported action through risk policy before anything is recorded as an execution.

## Project Summary

MemoryAlpha captures completed market lessons as reusable packets. A packet stores the asset, timeframe, regime, signal source, thesis, observed window, outcome, drawdown, score, and creator. Other agents can import that packet into their own vaults and use it as context for future decisions without copying the creator's full strategy.

The current build includes a working web interface, a Node.js API server, live Bitget public spot candle access, persistent local JSON storage, risk evaluation, decision simulation, execution ledger records, portfolio analytics, simulation results, Bitget integration status, and Swarms listing metadata.

MemoryAlpha does not claim that a packet guarantees profit. A packet is structured market memory. The platform makes that memory inspectable, scored, and risk-gated.

## Why It Exists

Most trading agents lose their best lessons inside logs, prompts, screenshots, private backtests, or temporary context windows. When a familiar regime appears again, the next agent often has to learn from scratch.

MemoryAlpha gives agents a common way to package market experience:

- What market was observed.
- Which regime was detected.
- What thesis was formed.
- What happened after the signal.
- How much drawdown appeared.
- Whether the lesson is strong enough to reuse.
- Which risk limits must still be respected.

This creates a practical exchange layer for agent-owned trading memory.

## Core Concepts

### Memory Packet

A memory packet is a portable trading lesson. It contains:

- Symbol and granularity.
- Market regime.
- Signal source.
- Decision thesis.
- Observed candle window.
- Outcome percentage.
- Maximum drawdown.
- Average move.
- Score and score breakdown.
- Creator agent.
- Import count.

### Agent Vault

Each agent has published memory and imported memory. Published memory shows what the agent created. Imported memory shows what the agent learned from other agents.

### Risk Policy

Every memory-supported action is evaluated before it can become an execution record. Current checks include:

- Memory score threshold.
- Position exposure.
- Leverage.
- Stop-loss equity risk.

### Decision Layer

The decision simulator combines the selected agent, memory packet, market regime, packet score, and risk policy. It returns:

- `allow trade`
- `hold`
- `watch`
- `reduce`
- `blocked`

### Execution Ledger

Only `allow trade` decisions can be recorded as execution entries. Records store side, entry price, stop price, size, risk amount, status, exit price, and realized PnL.

## Current Functional Scope

- Live Bitget spot candle adapter.
- Multi-token watchlist: BTC, ETH, SOL, XRP, BGB, DOGE, TON, LINK, AVAX, and SUI.
- Live homepage market coverage across supported symbols.
- Memory harvesting from a selected symbol or the full watchlist.
- Persistent memory packets in `data/memories.json`.
- Persistent import events in `data/imports.json`.
- Persistent decision simulations in `data/decisions.json`.
- Persistent execution ledger records in `data/executions.json`.
- Agent profiles and agent vault pages.
- Packet detail pages with score breakdown and evidence window.
- Marketplace filters by symbol, regime, score, newest, outcome, drawdown, and imports.
- Risk policy evaluation.
- Decision simulation.
- Execution ledger recording and close flow.
- Simulation results by score, outcome, drawdown, regime, symbol, decision, and execution records.
- Agent evaluation across published memory, imported memory, coverage expansion, score lift, symbols, regimes, and decisions.
- Portfolio analytics across memory, decisions, executions, risk, win rate, and realized PnL.
- Bitget integration status and execution-intent payloads.
- Swarms submission metadata and API adapter.
- System status page backed by live API and data checks.

## Pages

- `/index.html` - landing page with project overview, market coverage, roadmap, whitepaper preview, and FAQ preview.
- `/app.html` - feature hub for the platform.
- `/guide.html` - step-by-step product guide.
- `/dashboard.html` - harvest live market data into memory packets and monitor symbol-scoped memory flow.
- `/marketplace.html` - browse and filter memory packets.
- `/packet.html` - inspect one memory packet and import it into an agent vault.
- `/agents.html` - view available agents.
- `/agent.html` - inspect one agent's published and imported memory.
- `/evaluation.html` - compare agent memory coverage and score lift.
- `/decision.html` - simulate memory-supported agent actions.
- `/executions.html` - record and close execution ledger entries.
- `/risk.html` - evaluate risk policy directly.
- `/portfolio.html` - view aggregate memory, decision, execution, risk, and PnL analytics.
- `/simulations.html` - review packet and decision simulation results.
- `/integrations.html` - inspect Bitget integration status and execution-intent payloads.
- `/swarms.html` - review Swarms agent listing details and submission payload.
- `/status.html` - check system module health.
- `/about.html` - project explanation.
- `/whitepaper.html` - whitepaper page.
- `/roadmap.html` - roadmap page.
- `/faq.html` - frequently asked questions.

## Product Guide

### 1. Open The App Hub

Open:

```text
http://127.0.0.1:4260/app.html
```

The app hub links to every operating area of MemoryAlpha.

### 2. Harvest Market Memory

Open `/dashboard.html`.

Choose:

- Agent.
- Symbol.
- Granularity.
- Candle limit.

Use `Harvest Memory` for one symbol or `Harvest Watchlist` for all supported assets. The server fetches live Bitget public candles and creates scored packets from the observed window.

### 3. Read The Dashboard

The dashboard is scoped to the selected symbol. It shows:

- Latest packet score for the selected symbol.
- Selected-symbol packet count.
- Selected-symbol execution count.
- Symbol-specific decision log.

This prevents BTC records from appearing as SOL decisions or any other cross-symbol confusion.

### 4. Browse The Marketplace

Open `/marketplace.html`.

Use the filters to inspect packets by:

- Symbol.
- Regime.
- Score.
- Newest.
- Outcome.
- Drawdown control.
- Import count.

Open a packet to review its thesis, observed window, score, and risk evidence.

### 5. Import A Packet

Open a packet page from the marketplace. Importing a packet places that memory into another agent's vault as reusable decision context.

An import is not a trade. It is a record that an agent has accepted the packet as context.

### 6. Inspect Agents

Open `/agents.html` and choose an agent.

Each agent page shows:

- Published packets.
- Imported packets.
- Symbols covered.
- Regimes covered.
- Vault activity.

### 7. Evaluate Risk

Open `/risk.html`.

The risk page checks whether a memory-supported action respects score, exposure, leverage, and stop-loss limits. Failed checks block the action.

### 8. Simulate A Decision

Open `/decision.html`.

Select a packet and agent, then enter policy values. The platform returns the final action. `allow trade` means the action passed the current policy. `hold`, `watch`, `reduce`, or `blocked` means execution should not proceed under the current context.

### 9. Record An Execution

Open `/executions.html`.

Only decisions that returned `allow trade` can be recorded. The ledger stores trade-side information and can later close the record with realized PnL.

### 10. Review Simulation Results

Open `/simulations.html`.

This page summarizes packet outcome, drawdown, score, regime, symbol coverage, decisions, and execution records. It gives a backtest-style view using the same Bitget candle windows used to create the packets.

### 11. Compare Agent Improvement

Open `/evaluation.html`.

Agent evaluation compares published and imported memory to show coverage expansion, score lift, new symbols, new regimes, and decision counts.

### 12. Check Integrations

Open `/integrations.html`.

The Bitget integration page shows public market data readiness, Agent Hub MCP configuration status, authenticated API configuration status, and execution-intent payloads.

Open `/swarms.html` to review the Swarms agent listing, user disclosures, use cases, and API payload.

## Data And Storage

The current build uses local JSON files:

- `data/memories.json`
- `data/imports.json`
- `data/decisions.json`
- `data/executions.json`

This makes the hackathon build inspectable and easy to run without an external database. For production deployment, these files should move to a durable database such as Postgres, Supabase, Neon, PlanetScale, or another hosted storage layer.

## API

### Health And Status

- `GET /api/health`
- `GET /api/status`

### Agents

- `GET /api/agents`
- `GET /api/agents/:id`
- `GET /api/agents/evaluation`

### Market Data

- `GET /api/symbols`
- `GET /api/market/summary?limit=10`
- `GET /api/market/candles?symbol=BTCUSDT&granularity=1h&limit=100`

### Memory

- `GET /api/memories`
- `GET /api/memories/:id`
- `POST /api/memories/harvest`
- `POST /api/imports`

### Risk And Decisions

- `POST /api/risk/evaluate`
- `GET /api/decisions`
- `POST /api/decisions/simulate`

### Executions And Portfolio

- `GET /api/executions`
- `POST /api/executions`
- `POST /api/executions/close`
- `GET /api/portfolio`
- `GET /api/simulations/results`

### Integrations

- `GET /api/integrations/bitget`
- `GET /api/integrations/bitget/intents`
- `GET /api/integrations/swarms`
- `POST /api/integrations/swarms/submit`

## Run Locally

Requirements:

- Node.js 18 or newer.
- No npm install is required for the current build.

Start:

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

The verifier checks static pages, core APIs, live Bitget candle access, dynamic agent/memory detail routes, SOL harvesting, risk evaluation, integration status, and Swarms metadata.

## Environment Variables

Optional variables:

```text
PORT=4260
BITGET_BASE_URL=https://api.bitget.com
BITGET_AGENT_HUB_MCP_URL=
BITGET_API_KEY=
SWARMS_API_KEY=
SWARMS_ADD_AGENT_URL=https://swarms.world/api/add-agent
```

Public Bitget candle data works without private API credentials. Private account execution should remain disabled until credentials, permissions, and deployment security are configured.

Do not commit API keys.

## Swarms Agent Use

MemoryAlpha can be presented on Swarms as an agent-memory and risk-context service for autonomous trading systems.

Users would use it to:

- Turn live market windows into scored memory packets.
- Review whether a packet is worth importing.
- Give another trading agent reusable market context.
- Check risk policy before acting on a memory.
- Produce an auditable decision and execution trail.

The Swarms page includes the listing payload and user-facing limits so people understand that the agent provides structured trading context, not guaranteed profit or automatic private-account trading.

## Bitget / Agent Hub Direction

MemoryAlpha currently uses Bitget public spot candles as its live market data source. It also prepares Bitget-style execution-intent payloads after memory-supported decisions pass risk policy.

Authenticated exchange execution is intentionally separated from the public demo flow. A real account integration should require explicit credentials, account permissions, order validation, logging, and user approval.

## Roadmap

### Implemented

- Memory packet schema.
- Live Bitget candle capture.
- Agent vaults.
- Packet scoring.
- Risk-gated decisions.
- Execution ledger.
- Portfolio analytics.
- Simulation results.
- Bitget integration status and intent payloads.
- Agent evaluation.
- Swarms listing metadata.

### Next

- Open memory exchange pricing.
- Creator reputation and packet reviews.
- Packet versioning.
- Durable database migration.
- Authentication and user accounts.
- Production monitoring.
- Account-level execution permissions.
- Verified Swarms submission endpoint.
- Vercel-ready serverless API layout.

## Vercel Deployment Notes

The current project uses a single long-running Node.js server in `server.cjs`. That is excellent for local preview, but Vercel expects static assets plus serverless API functions.

Before deploying to Vercel, the server should be adapted in one of these ways:

- Keep HTML, CSS, and client JavaScript as static files.
- Move API routes from `server.cjs` into Vercel-compatible functions under `/api`.
- Replace local JSON writes with durable hosted storage.
- Add `vercel.json` routing for static pages and API functions.
- Set environment variables in the Vercel dashboard.

This keeps the deployed version real and reliable instead of pretending local JSON storage is production infrastructure.

## Repository Structure

```text
.
├── index.html
├── app.html
├── guide.html
├── dashboard.html
├── marketplace.html
├── packet.html
├── agents.html
├── agent.html
├── evaluation.html
├── decision.html
├── executions.html
├── risk.html
├── portfolio.html
├── simulations.html
├── integrations.html
├── swarms.html
├── status.html
├── whitepaper.html
├── roadmap.html
├── faq.html
├── app.js
├── styles.css
├── server.cjs
├── verify.cjs
├── data/
│   ├── memories.json
│   ├── imports.json
│   ├── decisions.json
│   └── executions.json
├── WHITEPAPER.md
├── ROADMAP.md
├── preview.cmd
├── stop-preview.cmd
└── verify.cmd
```

## Safety Position

MemoryAlpha is decision-support infrastructure. It does not promise returns, does not bypass risk checks, and does not execute private account orders without explicit authenticated configuration.

The purpose of the platform is to make agent trading memory reusable, inspectable, scored, and accountable.
