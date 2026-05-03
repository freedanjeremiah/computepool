# Gensyn — AXL sponsor judging packet

> **TL;DR.** We made AXL deployable in one command. Prebuilt **NVIDIA + CPU Docker images** carry the AXL binary inside; **Tailscale support is native to the same compose stack** so operators run AXL on a private mesh with zero exposed ports. On top of that we ship the AXL workload everyone wants but nobody had: **layer-pipelined LLM inference across separate AXL nodes**.

---

## ⚡ Unlock #1 — One-click deploy. AXL binary prebuilt. NVIDIA + CPU.

The single biggest barrier to AXL adoption is the build step. We removed it.

- **Multi-stage Dockerfile** → [`docker/Dockerfile`](../../docker/Dockerfile)
  Go stage compiles the AXL daemon; Python stage layers the worker on top. Result: one image, `dis-com:latest`, with the **AXL binary already inside**. No Go toolchain on the operator's host.
- **CPU variant** → [`docker-compose.yml`](../../docker-compose.yml)
  Boots the orchestrator + two AXL workers on any laptop or server with Docker.
- **NVIDIA variant** → [`docker-compose.gpu.yml`](../../docker-compose.gpu.yml) + [`docker-compose.gpu-extra.yml`](../../docker-compose.gpu-extra.yml)
  Overlays the NVIDIA runtime + CUDA-built PyTorch wheels for GPU operators.
- **One-line operator onboarding** → [`scripts/run-remote-worker.sh`](../../scripts/run-remote-worker.sh)
  ```sh
  ./scripts/run-remote-worker.sh --node-id node-c \
      --orchestrator https://orchestrator.example.com \
      --worker-url https://this-host.example.com \
      --peer node-a.tailnet:7001
  ```
  Pulls the image, generates `node-config.json` from the args, starts the container. AXL is already inside.

> **Net result for AXL adoption:** the next ten projects shipping on AXL fork our Dockerfile, swap the worker payload, and ship same-day.

---

## ⚡ Unlock #2 — Native Tailscale in the same compose stack

AXL needs a routable peer address. Consumer / prosumer operators sit behind home NATs, university firewalls, and corporate networks. Asking them to forward ports to the public internet is a hard "no" — and unsafe, since AXL has no peer allowlist yet.

We brought Tailscale **into the same docker-compose** so AXL meshes over a private WireGuard tailnet:

- **Compose file** → [`docker-compose.tailscale.yml`](../../docker-compose.tailscale.yml)
  Tailscale sidecar joins the tailnet first; the worker uses `network_mode: "service:tailscale"` so AXL binds to the tailnet interface only. `PEER_ADDR` resolves to the peer's `100.x.x.x` IP.

**For an operator on a residential ISP:**
- 0 ports open to the public internet (`nmap` from outside finds nothing).
- AXL handshake still completes peer-to-peer through any NAT.
- Traffic is **double-encrypted** — WireGuard at the tailnet layer + AXL ed25519 TLS at the application layer.
- No router config, no port forwarding, no inbound firewall rules.

> **Net result for AXL adoption:** "use AXL" no longer requires "open a port on your home router."

---

## The workload: sharded LLM inference over AXL

Both unlocks above exist to serve a real production workload:

- [`worker/pipeline.py`](../../worker/pipeline.py) — `entry_generate` runs the first half of the model, packs the hidden-state tensor with [`framing.pack_tensor`](../../worker/framing.py), and `axl.send`s it. `exit_loop` runs `forward_exit`, samples the next token, and `axl.send`s it back. **Per token. Tens of MB of activations crossing AXL every second.**
- [`worker/axl_client.py`](../../worker/axl_client.py) — async HTTP wrapper around AXL's `/send`, `/recv`, `/topology`.
- [`worker/framing.py`](../../worker/framing.py) — bf16-safe binary frame format (numpy lacks bfloat16, so we round-trip the tensor as a `uint8` view).

Multi-node by construction: `make up` brings up `node-a` + `node-b` as separate containers each with its own AXL daemon. The orchestrator never touches activations.

---

## Track qualification

| Requirement | How we satisfy it |
|---|---|
| Use AXL for inter-node communication | Every per-token hidden-state hop + sampled token rides AXL `/send` + `/recv`. |
| No centralized broker replacing AXL | Orchestrator is HTTP control plane only (`configure`, `load`, `unload`, `generate`); inference data plane is exclusively AXL P2P. |
| Communication across separate AXL nodes | Each worker is a separate container with its own AXL daemon. Tested across hosts with `scripts/run-remote-worker.sh`. |
| Built during the hackathon | Git history reflects this. |

---

## File index

```
worker/axl_client.py              AXL HTTP client (send / recv / topology)
worker/framing.py                 bf16-safe binary wire format
worker/pipeline.py                entry_generate / exit_loop — per-token AXL hops
worker/app.py                     Worker FastAPI; spawns AXL daemon, wires PEER_ADDR
docker/Dockerfile                 Multi-stage: Go AXL daemon + Python worker
docker-compose.yml                CPU variant — orchestrator + node-a + node-b
docker-compose.gpu.yml            NVIDIA runtime overlay
docker-compose.gpu-extra.yml      Extra CUDA wheels for GPU operators
docker-compose.tailscale.yml      Native Tailscale sidecar — zero-port deploy
scripts/run-remote-worker.sh      One-line remote operator onboarding
```
