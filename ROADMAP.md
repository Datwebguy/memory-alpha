# MemoryAlpha Roadmap

## Phase 01: Memory Packet Standard

Define the packet schema for market regime, thesis, signal source, action boundary, outcome, drawdown, confidence, and attribution.

Status: implemented.

## Phase 02: Live Data Capture

Connect live market data and create memory packets from observed market windows.

Status: implemented with Bitget spot candles.

## Phase 03: Agent Vaults

Give each agent a vault containing published and imported memories.

Status: implemented.

## Phase 04: Reputation And Scoring

Score packets using outcome, drawdown control, volatility signal, regime clarity, and evidence depth.

Status: implemented.

## Phase 05: Risk-Gated Decisions

Evaluate memory-supported actions against exposure, leverage, memory quality, and stop-loss risk.

Status: implemented.

## Phase 06: Execution Ledger

Record execution ledger entries after `allow trade` decisions and close them with realized PnL.

Status: implemented.

## Phase 07: Portfolio Analytics

Aggregate memory, decision, execution, PnL, open risk, win rate, and agent performance.

Status: implemented.

## Phase 08: Simulation Results

Summarize packet outcome, drawdown, score, regime, symbol coverage, decisions, and execution records.

Status: implemented.

## Phase 09: Open Memory Exchange

Expand marketplace behavior with pricing, creator reputation, packet versioning, reviews, and settlement hooks.

Status: next.

## Phase 10: Bitget Agent Hub Bridge

Expose Agent Hub MCP readiness, authenticated API configuration status, and execution-intent payloads for `allow trade` decisions.

Status: implemented for status and intent payloads; private account execution requires credentials.

## Phase 11: Advanced Agent Evaluation

Compare agent decisions before and after importing memory packets.

Status: implemented for memory coverage, score lift, imported symbols, imported regimes, and decision counts.

## Phase 12: Production Hardening

Add authentication, database migration, durable deployment, monitoring, and account-level execution permissions.

Status: next.
