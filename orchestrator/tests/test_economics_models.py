from datetime import datetime, timezone

from orchestrator.models import (
    Coalition, CoalitionState,
    PaymentPool, PaymentPoolState,
    Payment, PaymentState,
)


def test_coalition_serializes():
    c = Coalition(
        id="c1", pool_id="p1", onchain_id=None,
        terms_hash="0x" + "ab" * 32,
        participants=["0xa", "0xb"],
        signatures={"0xa": "0xsig"},
        state=CoalitionState.PROPOSED,
        deadline=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
    )
    d = c.model_dump()
    assert d["state"] == "proposed"
    assert d["onchain_id"] is None


def test_payment_pool_states():
    assert PaymentPoolState.READY.value == "ready"
    assert PaymentPoolState.STREAMING.value == "streaming"


def test_payment_states():
    assert PaymentState.VERIFIED.value == "verified"
    assert PaymentState.SETTLED.value == "settled"
