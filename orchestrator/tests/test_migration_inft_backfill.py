import importlib.util
import pathlib
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


def _load_migration():
    path = (
        pathlib.Path(__file__).parent.parent
        / "migrations"
        / "2026_05_mint_inft_for_existing_pools.py"
    )
    spec = importlib.util.spec_from_file_location("migration_under_test", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class _Cursor:
    def __init__(self, items):
        self._items = list(items)
    def __aiter__(self):
        self._iter = iter(self._items)
        return self
    async def __anext__(self):
        try:
            return next(self._iter)
        except StopIteration:
            raise StopAsyncIteration


@pytest.mark.asyncio
async def test_main_skips_pools_without_owner_wallet(monkeypatch):
    mod = _load_migration()
    fake_settings = MagicMock(
        inft_contract_addr="0x" + "ab" * 20,
        inft_oracle_private_key="0x" + "11" * 32,
        zero_g_chain_rpc="https://x",
        zero_g_chain_id=16602,
        zero_g_storage_indexer_url="https://idx",
    )
    fake_db = MagicMock()
    fake_db.pools.find = lambda *a, **kw: _Cursor([
        {"_id": 1, "name": "p1", "model": "Qwen/Qwen2.5-3B-Instruct",
         "owner_username": "alice", "assignments": []},
    ])
    fake_db.users.find_one = AsyncMock(return_value={"username": "alice"})  # no wallet
    monkeypatch.setattr(mod, "get_settings", lambda: fake_settings)
    monkeypatch.setattr(mod, "get_db", lambda: fake_db)
    monkeypatch.setattr(mod, "INFTClient", MagicMock())
    monkeypatch.setattr(mod, "AsyncWeb3", MagicMock())
    monkeypatch.setattr(mod, "AsyncHTTPProvider", MagicMock())
    monkeypatch.setattr(mod, "build_and_mint_for_pool", AsyncMock())
    rc = await mod.main()
    assert rc == 0
    mod.build_and_mint_for_pool.assert_not_awaited()


@pytest.mark.asyncio
async def test_main_calls_facade_with_expected_args(monkeypatch):
    mod = _load_migration()
    fake_settings = MagicMock(
        inft_contract_addr="0x" + "ab" * 20,
        inft_oracle_private_key="0x" + "11" * 32,
        zero_g_chain_rpc="https://x",
        zero_g_chain_id=16602,
        zero_g_storage_indexer_url="https://idx",
    )
    pool = {
        "_id": 1, "name": "p1", "model": "Qwen/Qwen2.5-3B-Instruct",
        "owner_username": "alice",
        "assignments": [
            {"node_id": "a", "role": "entry", "axl_pubkey": "0xa"},
            {"node_id": "b", "role": "exit",  "axl_pubkey": "0xb"},
        ],
    }
    fake_db = MagicMock()
    fake_db.pools.find = lambda *a, **kw: _Cursor([pool])
    fake_db.pools.update_one = AsyncMock()
    fake_db.users.find_one = AsyncMock(return_value={
        "username": "alice",
        "wallet_address": "0x" + "cc" * 20,
        "wallet_pubkey": "11" * 64,
    })
    monkeypatch.setattr(mod, "get_settings", lambda: fake_settings)
    monkeypatch.setattr(mod, "get_db", lambda: fake_db)
    monkeypatch.setattr(mod, "INFTClient", MagicMock())
    monkeypatch.setattr(mod, "AsyncWeb3", MagicMock())
    monkeypatch.setattr(mod, "AsyncHTTPProvider", MagicMock())
    facade = AsyncMock(return_value={"token_id": 7, "metadata_uri": "0g://abc", "metadata_hash": "00"})
    monkeypatch.setattr(mod, "build_and_mint_for_pool", facade)

    rc = await mod.main()
    assert rc == 0
    facade.assert_awaited_once()
    kwargs = facade.await_args.kwargs
    assert kwargs["pool_doc"] is pool
    assert kwargs["owner_address"] == "0x" + "cc" * 20
    assert kwargs["total_layers"] == 36
    assert kwargs["hf_revision"] == "main"
    fake_db.pools.update_one.assert_awaited_once()
