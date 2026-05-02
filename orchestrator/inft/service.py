import os
from typing import Awaitable, Callable, Optional

from .crypto import encrypt, seal_to_pubkey
from .metadata import PoolMetadata, canonical_dumps, content_hash


async def build_and_mint_for_pool(
    *,
    pool_doc: dict,
    owner_address: str,
    owner_pubkey_uncompressed: bytes,
    orchestrator_signer: str,
    upload: Callable[..., Awaitable[str]],
    client,                          # INFTClient or compatible (.mint(to=, metadata_hash=, metadata_uri=, sealed_key=) -> int)
    indexer_url: str,
    hf_revision: str,
    total_layers: int,
    hf_token: Optional[str] = None,
) -> dict:
    """Compose plaintext metadata for a pool, encrypt with a fresh AES-GCM key,
    seal the key to the recipient's secp256k1 pubkey, upload the encrypted blob to
    0G Storage, and mint a PoolINFT.

    Returns: {"token_id": int, "metadata_uri": str, "metadata_hash": str (hex)}.
    """
    entry = next(a for a in pool_doc["assignments"] if a["role"] == "entry")
    exit_ = next(a for a in pool_doc["assignments"] if a["role"] == "exit")
    mid = total_layers // 2
    meta = PoolMetadata(
        model_id=pool_doc["model"],
        hf_revision=hf_revision,
        total_layers=total_layers,
        split={"entry": [0, mid], "exit": [mid, total_layers]},
        axl_pubkeys={"entry": entry["axl_pubkey"], "exit": exit_["axl_pubkey"]},
        orchestrator_signer=orchestrator_signer,
        hf_token=hf_token,
    )
    plaintext = canonical_dumps(meta).encode()
    aes_key = os.urandom(32)
    blob = encrypt(aes_key, plaintext)
    uri = await upload(blob, indexer_url=indexer_url)
    sealed = seal_to_pubkey(owner_pubkey_uncompressed, aes_key)
    metadata_hash = content_hash(meta)
    token_id = await client.mint(
        to=owner_address,
        metadata_hash=metadata_hash,
        metadata_uri=uri,
        sealed_key=sealed,
    )
    return {
        "token_id": token_id,
        "metadata_uri": uri,
        "metadata_hash": metadata_hash.hex(),
    }
