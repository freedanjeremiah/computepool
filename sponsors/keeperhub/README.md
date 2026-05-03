# KeeperHub — sponsor judging packet

> **TL;DR.** Two upstream PRs against `KeeperHub/keeperhub:staging`, plus the first KeeperHub product wiring **x402 vouchers + Superfluid streams** as a single payment primitive. KeeperHub isn't bolted on — pull it out and the product collapses.

---

## ⚡ Two upstream PRs to KeeperHub

| PR | Title | Commits | What it adds |
|---|---|---:|---|
| [**KeeperHub#1106**](https://github.com/KeeperHub/keeperhub/pull/1106) | `feat: add Superfluid protocol` | 12 | Native KH actions for Superfluid: `createPool`, `updateMemberUnits`, `distributeFlow`. Any KH workflow can now stream tokens per-second without bespoke contract calls. |
| [**KeeperHub#1105**](https://github.com/KeeperHub/keeperhub/pull/1105) | `feat: add Coalition plugin (multi-party on-chain commitments with slashing)` | 18 | First-class primitive for "N parties commit on-chain to do a thing; if any breach, the keeper slashes." Useful for any multi-operator workflow that touches money. |

Specs in this repo:
- [`PRD-2-superfluid-plugin.md`](../../PRD-2-superfluid-plugin.md)
- [`PRD-1-coalition-plugin.md`](../../PRD-1-coalition-plugin.md)

Branches:
- `Philotheephilix:feat/superfluid-protocol` → `KeeperHub/keeperhub:staging`
- `Philotheephilix:feat/KEEP-XXX-coalition-plugin` → `KeeperHub/keeperhub:staging`

---

## ⚡ Innovative use — x402 + payment streams

The shape every API economy lands on is **"pay once to start, then pay per second while you use it."** That's two protocols today (x402 for the open, Superfluid for the meter) and nobody had wired them together as a single workflow primitive.

We did. The orchestrator runs the bond:

1. **Agent calls the API.** Our OpenAI-compatible router returns `HTTP 402` with the x402 challenge → [`orchestrator/x402.py`](../../orchestrator/x402.py).
2. **Agent signs the voucher** (EIP-3009 `transferWithAuthorization`) and replays. Our self-hosted facilitator settles it on-chain → [`facilitator/`](../../facilitator/).
3. **Orchestrator fires the KH `stream-start` workflow** → KH calls `GDA.distributeFlow` at the negotiated rate → [`keeperhub/compute-coalition-stream-start.workflow.json`](../../keeperhub/compute-coalition-stream-start.workflow.json).
4. **Operators earn USDCx by the second** while inference runs.
5. **EOS or client disconnect** fires `stream-stop` → [`keeperhub/compute-coalition-stream-stop.workflow.json`](../../keeperhub/compute-coalition-stream-stop.workflow.json) → meter halts to the second.

> An agent in any framework can `POST /v1/chat/completions` with one signed x402 voucher, and the **entire downstream payment lifecycle — including continuous per-second payouts — runs through KeeperHub workflows**. This is the future shape of the agent economy; we shipped the first one.

Five KH workflows drive the full lifecycle:

| Workflow | Action |
|---|---|
| [`compute-coalition-propose.workflow.json`](../../keeperhub/compute-coalition-propose.workflow.json) | `Coalition.propose` → POST `coalition_proposed` |
| [`compute-coalition-activate-and-pool.workflow.json`](../../keeperhub/compute-coalition-activate-and-pool.workflow.json) | `Coalition.activate` → `GDA.createPool` → `updateMemberUnits` ×2 → POST `payment_pool_ready` |
| [`compute-coalition-stream-start.workflow.json`](../../keeperhub/compute-coalition-stream-start.workflow.json) | `GDA.distributeFlow(rate)` → POST `stream_started` |
| [`compute-coalition-stream-stop.workflow.json`](../../keeperhub/compute-coalition-stream-stop.workflow.json) | `GDA.distributeFlow(0)` → POST `stream_stopped` |
| [`compute-coalition-handle-breach.workflow.json`](../../keeperhub/compute-coalition-handle-breach.workflow.json) | `recordBreach` → `slash` → `updateMemberUnits=0` → POST `breach_slashed` |

Drivers + callbacks:
- [`orchestrator/keeperhub.py`](../../orchestrator/keeperhub.py) — KH MCP/JSON-RPC client
- [`orchestrator/economics.py`](../../orchestrator/economics.py) — drives the workflows
- [`orchestrator/webhooks.py`](../../orchestrator/webhooks.py) + [`orchestrator/webhook_verifier.py`](../../orchestrator/webhook_verifier.py) — HMAC-verified callbacks

---

## Track qualification

Hits **both** focus areas under one ranked prize pool.

| Focus area | How we satisfy it |
|---|---|
| **Innovative Use** — solve a real problem with KH's execution layer | Five workflows are the system of record for an N-operator GPU coalition's payment + slashing lifecycle. The product fails without KH. |
| **Integration** — wire KH to payment rails (x402 / MPP) **and** agent frameworks | x402 + Superfluid as a single workflow primitive (above). OpenAI-compat router means any LangChain / CrewAI / OpenAgents client routes through KH with no SDK. Plus two upstream PRs. |
| Builder Feedback Bounty | See feedback in [`docs/submission.md`](../../docs/submission.md) under the KeeperHub section. |

---

## File index

```
keeperhub/                                    Five workflow JSON exports (re-importable)
keeperhub/README.md                           Re-import instructions + workflow IDs
orchestrator/keeperhub.py                     KH MCP / JSON-RPC client
orchestrator/economics.py                     Drives the workflows
orchestrator/webhooks.py                      KH webhook receiver
orchestrator/webhook_verifier.py              HMAC verification of KH webhook signatures
orchestrator/x402.py                          x402 paywall (the inbound rail KH integrates with)
orchestrator/api/openai_compat.py             OpenAI-compat router with x402 challenge
orchestrator/api/openai_auth.py               Per-call auth flow for OpenAI-compat
facilitator/                                  x402 facilitator (relayer)
PRD-2-superfluid-plugin.md                    Superfluid plugin spec (PR #1106)
PRD-1-coalition-plugin.md                     Coalition plugin spec (PR #1105)
scripts/e2e_demo.py                           End-to-end: x402 → KH → Superfluid → inference
```
