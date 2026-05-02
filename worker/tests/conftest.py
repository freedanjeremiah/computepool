import pytest


@pytest.fixture(autouse=True)
def _worker_env(monkeypatch):
    monkeypatch.setenv("NODE_ID", "node-test")
    monkeypatch.setenv("WORKER_URL", "http://localhost:7000")
    monkeypatch.setenv("ORCHESTRATOR_URL", "http://localhost:8000")
    monkeypatch.setenv("OWNER_API_KEY", "test_key")
    monkeypatch.setenv("WORKER_PRIVATE_KEY", "0x" + "55" * 32)
