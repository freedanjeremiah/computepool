.PHONY: build up down restart logs logs-orch logs-a logs-b ps status clean help

IMAGE := dis-com:latest
ORCH  ?= http://localhost:8000

help:
	@echo "Targets:"
	@echo "  build       Build the dis-com image"
	@echo "  up          Start orchestrator + node-a + node-b"
	@echo "  down        Stop the cluster"
	@echo "  restart     down + up"
	@echo "  ps          Show container status"
	@echo "  logs        Tail logs from all services"
	@echo "  logs-orch   Tail orchestrator logs"
	@echo "  logs-a      Tail node-a logs"
	@echo "  logs-b      Tail node-b logs"
	@echo "  status      Show /api/state from the orchestrator (requires X-API-Key)"
	@echo "  clean       down -v + remove the image"

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

restart: down up

ps:
	docker compose ps

logs:
	docker compose logs -f --tail=200

logs-orch:
	docker compose logs -f orchestrator

logs-a:
	docker compose logs -f node-a

logs-b:
	docker compose logs -f node-b

status:
	@curl -sf -H "X-API-Key: $(API_KEY)" $(ORCH)/api/state | python3 -m json.tool

clean:
	docker compose down -v
	-docker rmi $(IMAGE)
