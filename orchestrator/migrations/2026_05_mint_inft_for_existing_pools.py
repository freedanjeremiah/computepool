"""One-shot: for every Mongo pool with state=loaded and no inft_token_id, mint a PoolINFT.

Run with:
    python -m orchestrator.migrations.2026_05_mint_inft_for_existing_pools

Idempotent: skips pools that already have `inft_token_id`. Skips pools whose owner
User document lacks `wallet_address` or `wallet_pubkey` (uncompressed secp256k1 hex,
no 0x prefix), logging a warning so operators can surface and fix them.
"""
import asyncio
import logging
import sys

from eth_account import Account
from web3 import AsyncHTTPProvider, AsyncWeb3

from orchestrator.db import get_db
from orchestrator.inft.client import INFTClient
from orchestrator.inft.service import build_and_mint_for_pool
from orchestrator.inft.storage_0g import upload_blob
from orchestrator.settings import get_settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
log = logging.getLogger("migrate-inft")

# Mirrors the orchestrator's MODEL_LAYERS; keep in sync.
MODEL_LAYERS = {
    "meta-llama/Llama-3.2-1B": 16,
    "meta-llama/Llama-3.2-3B": 28,
    "Qwen/Qwen2.5-3B-Instruct": 36,
    "Qwen/Qwen3-4B-Instruct-2507": 36,
}


async def main() -> int:
    settings = get_settings()
    if not settings.inft_contract_addr or not settings.inft_oracle_private_key:
        log.error("INFT_CONTRACT_ADDR and INFT_ORACLE_PRIVATE_KEY must be set; aborting")
        return 2

    db = get_db()
    w3 = AsyncWeb3(AsyncHTTPProvider(settings.zero_g_chain_rpc))
    admin = Account.from_key(settings.inft_oracle_private_key)
    client = INFTClient(
        w3=w3,
        address=settings.inft_contract_addr,
        admin_account=admin,
        chain_id=settings.zero_g_chain_id,
    )

    minted = skipped_owner = skipped_existing = errors = 0

    async for pool in db.pools.find({"state": "loaded", "inft_token_id": None}):
        if pool["model"] not in MODEL_LAYERS:
            log.warning("skip pool=%s: unknown model %s", pool["name"], pool["model"])
            errors += 1
            continue
        owner = await db.users.find_one({"username": pool["owner_username"]})
        if not owner or not owner.get("wallet_address") or not owner.get("wallet_pubkey"):
            log.warning("skip pool=%s: owner missing wallet_address/wallet_pubkey", pool["name"])
            skipped_owner += 1
            continue
        try:
            out = await build_and_mint_for_pool(
                pool_doc=pool,
                owner_address=owner["wallet_address"],
                owner_pubkey_uncompressed=bytes.fromhex(owner["wallet_pubkey"]),
                orchestrator_signer=admin.address,
                upload=upload_blob,
                client=client,
                indexer_url=settings.zero_g_storage_indexer_url,
                hf_revision="main",
                total_layers=MODEL_LAYERS[pool["model"]],
            )
        except Exception as e:
            log.exception("mint failed for pool=%s: %s", pool["name"], e)
            errors += 1
            continue

        await db.pools.update_one(
            {"_id": pool["_id"]},
            {"$set": {
                "inft_token_id": out["token_id"],
                "inft_metadata_uri": out["metadata_uri"],
            }},
        )
        log.info("minted token=%s for pool=%s", out["token_id"], pool["name"])
        minted += 1

    log.info(
        "migration complete: minted=%d skipped_owner=%d skipped_existing=%d errors=%d",
        minted, skipped_owner, skipped_existing, errors,
    )
    return 0 if errors == 0 else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
