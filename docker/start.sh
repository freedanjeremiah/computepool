#!/usr/bin/env bash
# Entrypoint dispatcher: start.sh {worker|orchestrator|shell}

set -euo pipefail

CMD="${1:-worker}"

log() { echo "[start.sh] $*"; }

start_axl() {
    local peer_url=""
    if [ -n "${PEER_ADDR:-}" ]; then
        peer_url="${PEER_ADDR}"
    elif [ -n "${PEER_HOST:-}" ]; then
        peer_url="tls://${PEER_HOST}:7001"
    else
        echo "[start.sh] ERROR: set PEER_HOST (e.g. 'node-b') or PEER_ADDR (e.g. 'tls://1.2.3.4:7001')" >&2
        exit 1
    fi

    mkdir -p /data
    if [ ! -f /data/private.pem ]; then
        log "generating ed25519 private key at /data/private.pem"
        openssl genpkey -algorithm ed25519 -out /data/private.pem
        chmod 600 /data/private.pem
    fi

    # AXL's default tcp_port (7000) collides with our worker, so we override to 7001.
    cat > /data/node-config.json <<EOF
{
  "PrivateKeyPath": "/data/private.pem",
  "Peers": ["${peer_url}"],
  "Listen": ["tls://[::]:7001"],
  "tcp_port": 7001,
  "api_port": 9002
}
EOF
    log "wrote /data/node-config.json (peer=${peer_url})"

    /usr/local/bin/node -config /data/node-config.json &
    AXL_PID=$!
    log "AXL daemon pid=${AXL_PID}"

    trap 'log "shutting down (axl pid=${AXL_PID})"; kill "${AXL_PID}" 2>/dev/null || true' EXIT INT TERM

    for i in $(seq 1 30); do
        if curl -sf "http://localhost:9002/topology" >/dev/null 2>&1; then
            log "AXL API ready on localhost:9002"
            return 0
        fi
        sleep 1
    done
    log "WARNING: AXL API not reachable after 30s; worker will keep retrying"
}

case "${CMD}" in
    orchestrator)
        log "starting orchestrator on :8000"
        cd /app
        exec uvicorn orchestrator.app:app --host 0.0.0.0 --port 8000
        ;;
    worker)
        : "${NODE_ID:?NODE_ID must be set for worker mode}"
        : "${ORCHESTRATOR_URL:?ORCHESTRATOR_URL must be set for worker mode}"
        : "${WORKER_URL:?WORKER_URL must be set for worker mode}"
        start_axl
        log "starting worker on :7000 (NODE_ID=${NODE_ID})"
        cd /app
        exec uvicorn worker.app:app --host 0.0.0.0 --port 7000
        ;;
    shell)
        exec /bin/bash
        ;;
    *)
        echo "[start.sh] unknown command: ${CMD}" >&2
        echo "usage: start.sh {worker|orchestrator|shell}" >&2
        exit 1
        ;;
esac
