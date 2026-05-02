import pytest
from unittest.mock import AsyncMock

from orchestrator.economics import EconomicsService


class _Coll:
    def __init__(self, items=None):
        self.items = list(items or [])
        self.inserted = []
        self.updates = []

    async def insert_one(self, d):
        self.inserted.append(d)

    async def update_one(self, q, u):
        self.updates.append((q, u))

    async def find_one(self, q):
        for d in self.items:
            if all(d.get(k) == v for k, v in q.items()):
                return d
        return None


@pytest.mark.asyncio
async def test_on_payment_received_starts_stream(_orchestrator_env):
    from orchestrator.settings import get_settings

    settings = get_settings()
    db = type("DB", (), {})()
    db.payment_pools = _Coll(
        [
            {
                "pool_id": "p1",
                "superfluid_pool_address": "0xpool",
                "super_token": settings.usdcx_address,
            }
        ]
    )
    db.payments = _Coll()
    kh = AsyncMock()
    kh.execute_workflow = AsyncMock(return_value={"executionId": "e"})
    svc = EconomicsService(
        db=db, kh=kh, chain=None, settings=settings, http=AsyncMock()
    )

    await svc.on_payment_received(
        pool_id="p1",
        payer="0xa",
        amount_usdc_micro=1000,
        amount_usdcx_wei=1_000_000_000_000_000,
        estimated_duration_s=10.0,
        inference_request_id="req-1",
    )
    assert db.payments.inserted[0]["_id"] == "req-1"
    kh.execute_workflow.assert_awaited_once()
    args, kwargs = kh.execute_workflow.call_args
    assert args[0] == settings.kh_workflow_stream_start
    assert kwargs["inputs"]["pool_address"] == "0xpool"


@pytest.mark.asyncio
async def test_on_inference_complete_stops_stream(_orchestrator_env):
    from orchestrator.settings import get_settings

    settings = get_settings()
    db = type("DB", (), {})()
    db.payment_pools = _Coll(
        [
            {
                "pool_id": "p1",
                "superfluid_pool_address": "0xpool",
                "super_token": settings.usdcx_address,
            }
        ]
    )
    kh = AsyncMock()
    kh.execute_workflow = AsyncMock(return_value={"executionId": "e"})
    svc = EconomicsService(
        db=db, kh=kh, chain=None, settings=settings, http=AsyncMock()
    )

    await svc.on_inference_complete(pool_id="p1", inference_request_id="req-1")
    args, kwargs = kh.execute_workflow.call_args
    assert args[0] == settings.kh_workflow_stream_stop
    assert kwargs["inputs"]["pool_address"] == "0xpool"
