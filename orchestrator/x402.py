import base64
import json
import httpx
from .settings import get_settings


def build_payment_requirements(*, resource: str, max_amount_micro: int,
                               description: str) -> dict:
    s = get_settings()
    return {
        "scheme": "exact",
        "network": "sepolia",
        "maxAmountRequired": str(max_amount_micro),
        "resource": resource,
        "description": description,
        "mimeType": "application/json",
        "payTo": s.orchestrator_wallet_address,
        "maxTimeoutSeconds": 60,
        "asset": s.usdc_address,
        "extra": {"name": "USD Coin", "version": "2"},
    }


def parse_payment_header(header: str) -> dict:
    raw = base64.b64decode(header)
    return json.loads(raw)


async def verify_via_facilitator(payment: dict, requirements: dict) -> dict:
    s = get_settings()
    async with httpx.AsyncClient(timeout=15.0) as c:
        r = await c.post(s.x402_facilitator_url.rstrip("/") + "/verify", json={
            "x402Version": 1,
            "paymentPayload": payment,
            "paymentRequirements": requirements,
        })
        r.raise_for_status()
        return r.json()


async def settle_via_facilitator(payment: dict, requirements: dict) -> dict:
    s = get_settings()
    async with httpx.AsyncClient(timeout=60.0) as c:
        r = await c.post(s.x402_facilitator_url.rstrip("/") + "/settle", json={
            "x402Version": 1,
            "paymentPayload": payment,
            "paymentRequirements": requirements,
        })
        r.raise_for_status()
        return r.json()


def build_payment_response_header(settle_result: dict) -> str:
    return base64.b64encode(json.dumps(settle_result).encode()).decode()
