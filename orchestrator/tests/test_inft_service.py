import pytest
from eth_account import Account

from orchestrator.inft.service import build_and_mint_for_pool


@pytest.mark.asyncio
async def test_build_and_mint_uploads_blob_then_mints():
    captured = {}

    async def fake_upload(blob, *, indexer_url):
        captured["blob"] = blob
        captured["indexer_url"] = indexer_url
        return "0g://abcd"

    class FakeClient:
        async def mint(self, *, to, metadata_hash, metadata_uri, sealed_key):
            captured["mint"] = {
                "to": to, "hash": metadata_hash, "uri": metadata_uri, "sealed_len": len(sealed_key),
            }
            return 99

    owner = Account.create()
    pool_doc = {
        "name": "p1",
        "model": "Qwen/Qwen2.5-3B-Instruct",
        "assignments": [
            {"node_id": "a", "role": "entry", "axl_pubkey": "0x01"},
            {"node_id": "b", "role": "exit",  "axl_pubkey": "0x02"},
        ],
    }

    out = await build_and_mint_for_pool(
        pool_doc=pool_doc,
        owner_address=owner.address,
        owner_pubkey_uncompressed=bytes.fromhex(owner._key_obj.public_key.to_hex().removeprefix("0x")),
        orchestrator_signer="0x" + "33" * 20,
        upload=fake_upload,
        client=FakeClient(),
        indexer_url="https://indexer.test",
        hf_revision="main",
        total_layers=36,
    )
    assert out["token_id"] == 99
    assert out["metadata_uri"] == "0g://abcd"
    assert isinstance(out["metadata_hash"], str) and len(out["metadata_hash"]) == 64  # hex of sha256
    assert captured["mint"]["to"] == owner.address
    assert captured["mint"]["uri"] == "0g://abcd"
    assert captured["mint"]["sealed_len"] > 0
    # The encrypted blob is non-empty and is NOT plaintext metadata
    assert len(captured["blob"]) > 0
    assert b"Qwen" not in captured["blob"]


@pytest.mark.asyncio
async def test_build_and_mint_split_is_total_div_2():
    """Verify the layer split places mid = total_layers // 2."""
    captured = {}

    async def fake_upload(blob, *, indexer_url):
        return "0g://x"

    class FakeClient:
        async def mint(self, *, to, metadata_hash, metadata_uri, sealed_key):
            captured["hash"] = metadata_hash
            return 1

    from orchestrator.inft.metadata import PoolMetadata, content_hash
    expected_meta = PoolMetadata(
        model_id="m", hf_revision="main", total_layers=28,
        split={"entry": [0, 14], "exit": [14, 28]},
        axl_pubkeys={"entry": "0xa", "exit": "0xb"},
        orchestrator_signer="0x" + "33" * 20,
    )
    owner = Account.create()
    out = await build_and_mint_for_pool(
        pool_doc={
            "name": "p", "model": "m",
            "assignments": [
                {"node_id": "a", "role": "entry", "axl_pubkey": "0xa"},
                {"node_id": "b", "role": "exit",  "axl_pubkey": "0xb"},
            ],
        },
        owner_address=owner.address,
        owner_pubkey_uncompressed=bytes.fromhex(owner._key_obj.public_key.to_hex().removeprefix("0x")),
        orchestrator_signer="0x" + "33" * 20,
        upload=fake_upload,
        client=FakeClient(),
        indexer_url="https://x",
        hf_revision="main",
        total_layers=28,
    )
    # Hash is computed over the canonical metadata; should match the expected hash.
    assert captured["hash"] == content_hash(expected_meta)
