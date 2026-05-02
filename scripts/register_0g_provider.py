"""Register THIS orchestrator (URL + TEE signer) with the 0G Compute Router as a Service provider.

Idempotent: queries current state first; only sends a tx if (url, signer) need updating.

Env:
  ZERO_G_CHAIN_RPC      — e.g. https://evmrpc-testnet.0g.ai
  ZERO_G_CHAIN_ID       — default 16602 (Galileo testnet)
  COMPUTE_ROUTER_ADDR   — deployed Router contract address (operator-supplied)
  ADMIN_PRIVATE_KEY     — EOA that owns the Service entry under (admin, SERVICE_NAME)
  SERVICE_NAME          — string key for the entry
  SERVICE_URL           — public HTTPS URL of this orchestrator
  TEE_SIGNER_ADDR       — address that will sign /v1/chat/completions responses

Replace `scripts/0g_router.abi.json` with the real Router ABI before production use; the
function selectors below assume `registerService(name, url, signer)` and
`getService(owner, name) → (url, signer)`.
"""
import asyncio
import json
import os
import pathlib
import sys

from eth_account import Account
from web3 import AsyncHTTPProvider, AsyncWeb3


def _load_abi() -> list:
    path = pathlib.Path(__file__).parent / "0g_router.abi.json"
    return json.loads(path.read_text())


def _env(name: str, default: str | None = None, *, required: bool = True) -> str:
    v = os.environ.get(name, default)
    if required and not v:
        print(f"missing env var: {name}", file=sys.stderr)
        sys.exit(2)
    return v  # type: ignore[return-value]


async def main() -> int:
    rpc = _env("ZERO_G_CHAIN_RPC")
    chain_id = int(_env("ZERO_G_CHAIN_ID", "16602", required=False))
    router_addr = _env("COMPUTE_ROUTER_ADDR")
    admin_pk = _env("ADMIN_PRIVATE_KEY")
    name = _env("SERVICE_NAME")
    desired_url = _env("SERVICE_URL")
    desired_signer = _env("TEE_SIGNER_ADDR").lower()

    w3 = AsyncWeb3(AsyncHTTPProvider(rpc))
    admin = Account.from_key(admin_pk)
    router = w3.eth.contract(address=AsyncWeb3.to_checksum_address(router_addr), abi=_load_abi())

    current_url, current_signer = await router.functions.getService(admin.address, name).call()
    if current_url == desired_url and current_signer.lower() == desired_signer:
        print(f"no-op: registration already current (url={current_url}, signer={current_signer})")
        return 0

    print(f"updating: url {current_url!r} -> {desired_url!r}, signer {current_signer} -> {desired_signer}")
    fn = router.functions.registerService(name, desired_url, AsyncWeb3.to_checksum_address(desired_signer))
    tx = await fn.build_transaction({
        "from": admin.address,
        "nonce": await w3.eth.get_transaction_count(admin.address),
        "gas": 600_000,
        "maxFeePerGas": int(2e9),
        "maxPriorityFeePerGas": int(2e9),
        "chainId": chain_id,
    })
    signed = admin.sign_transaction(tx)
    h = await w3.eth.send_raw_transaction(signed.raw_transaction)
    rcpt = await w3.eth.wait_for_transaction_receipt(h)
    print(f"registered: tx={rcpt.transactionHash.hex()} block={rcpt.blockNumber}")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
