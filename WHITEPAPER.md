# MemoryAlpha Whitepaper

Version 0.1

## Thesis

Autonomous trading systems need durable experience, not only live signals. A useful trading agent should remember what happened, why an action was considered, what risk was accepted, and whether the outcome was worth repeating.

MemoryAlpha turns completed market lessons into structured memory packets that agents can publish, inspect, import, score, and use as decision context.

## Problem

Trading agents usually operate from a narrow context window. Valuable experience remains trapped in private logs, prompts, screenshots, dashboards, or one-off backtests. This makes it difficult for one agent to reuse another agent's proven regime knowledge without copying the entire strategy.

The result is repeated failure: new agents encounter familiar market regimes as if they were seeing them for the first time.

## Protocol Overview

MemoryAlpha defines a memory packet as a portable trading lesson.

A packet contains:

- Asset and timeframe
- Market regime
- Signal source
- Decision thesis
- Action boundary
- Result window
- Outcome percentage
- Maximum drawdown
- Confidence score
- Creator attribution

Packets are advisory. They do not place trades and cannot bypass account permissions or risk policy.

## Scoring Model

MemoryAlpha scores packets using:

- Outcome strength
- Drawdown control
- Volatility signal
- Regime clarity
- Evidence depth

The score is designed to reward useful experience, not just profitable hindsight. A high-quality packet should explain both opportunity and risk.

## Agent Marketplace

Agents can publish packets to a searchable exchange. Other agents can inspect the packet, import it into their vault, and use it as decision context.

This creates a market for agent-owned experience without forcing creators to reveal their full strategy stack.

## Risk Policy

Every memory-supported action must pass risk policy before execution.

Current policy checks:

- Memory quality threshold
- Position exposure limit
- Leverage limit
- Stop-loss equity risk

If any check fails, the decision is blocked before execution recording.

## Decision Layer

The decision simulator combines:

- Agent identity
- Selected memory packet
- Risk policy result
- Market regime
- Packet score

The output action is one of:

- `allow trade`
- `hold`
- `watch`
- `reduce`
- `blocked`

## Execution Ledger

Only `allow trade` decisions can be recorded as execution ledger entries. Each entry stores:

- Decision ID
- Agent
- Symbol
- Side
- Entry price
- Stop price
- Size
- Risk amount
- Status
- Exit price
- Realized PnL

This makes the system auditable from memory creation to final outcome.

## Portfolio Analytics

The portfolio layer aggregates:

- Total memory packets
- Total decisions
- Open and closed executions
- Realized PnL
- Open risk
- Win rate
- Agent performance
- Recent decisions

## Simulation Results

The simulation results layer summarizes harvested packet performance without inventing trade history. It reports packet count, decision count, execution records, average score, average outcome, worst drawdown, symbol-level results, regime-level results, and ranked packets. This gives judges a backtest-style view grounded in the same Bitget candle windows used to create the memory packets.

## Integration Direction

MemoryAlpha is designed to operate as infrastructure for agent trading systems. In the Bitget Agent Hub context, it serves as a memory, scoring, risk, and execution-intent layer around trading agents.

The current adapter uses Bitget public spot candles for live market data. After a memory-supported decision passes risk and action quality, MemoryAlpha can produce a Bitget-style order intent payload for Agent Hub MCP or exchange API tooling. Account-scoped trading remains behind explicit API configuration so the platform does not imply unauthorized execution.

## Safety Position

MemoryAlpha does not claim that a memory packet guarantees profit. It provides structured context and risk controls so agents can make more accountable decisions.
