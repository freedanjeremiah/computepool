import json
import os
import pathlib
import shutil
import socket
import subprocess
import time

import pytest
import pytest_asyncio
from eth_account import Account
from web3 import AsyncWeb3, AsyncHTTPProvider

from orchestrator.inft.client import INFTClient


def _find_anvil() -> str | None:
    """Return the path to anvil, checking common Foundry install locations."""
    found = shutil.which("anvil")
    if found:
        return found
    # Foundry default install locations
    for candidate in [
        os.path.expanduser("~/.foundry/bin/anvil"),
        os.path.expanduser("~/.foundry/versions/stable/anvil"),
        "/usr/local/bin/anvil",
    ]:
        if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
            return candidate
    return None


def _free_port() -> int:
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    p = s.getsockname()[1]
    s.close()
    return p


@pytest.fixture(scope="module")
def anvil():
    """Spin up `anvil` for the test module. Skip the whole module if anvil missing."""
    anvil_bin = _find_anvil()
    if anvil_bin is None:
        pytest.skip("anvil not on PATH; install Foundry to run INFTClient integration tests")
    port = _free_port()
    proc = subprocess.Popen(
        [anvil_bin, "--port", str(port), "--silent"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    # Wait for RPC to come up
    deadline = time.time() + 10
    while time.time() < deadline:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.2):
                break
        except OSError:
            time.sleep(0.1)
    else:
        proc.kill()
        pytest.skip("anvil failed to start in time")
    yield port
    proc.kill()
    proc.wait()


@pytest_asyncio.fixture
async def deployed(anvil):
    """Deploy PoolINFT to the anvil instance and return (client, oracle, addr)."""
    rpc_port = anvil
    w3 = AsyncWeb3(AsyncHTTPProvider(f"http://127.0.0.1:{rpc_port}"))
    # Anvil's first dev account; private key is well-known
    DEV_PK = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    admin = Account.from_key(DEV_PK)
    oracle = Account.create()

    # Path is relative to repo root; tests run from orchestrator/ so go up one level
    repo_root = pathlib.Path(__file__).parent.parent.parent
    artifact = json.loads(
        (repo_root / "contracts/out/PoolINFT.sol/PoolINFT.json").read_text()
    )
    abi = artifact["abi"]
    bytecode = artifact["bytecode"]["object"]
    Contract = w3.eth.contract(abi=abi, bytecode=bytecode)
    construct_tx = await Contract.constructor(oracle.address).build_transaction({
        "from": admin.address,
        "nonce": await w3.eth.get_transaction_count(admin.address),
        "gas": 4_000_000,
        "maxFeePerGas": int(2e9),
        "maxPriorityFeePerGas": int(2e9),
        "chainId": 31337,
    })
    signed = admin.sign_transaction(construct_tx)
    h = await w3.eth.send_raw_transaction(signed.raw_transaction)
    rcpt = await w3.eth.wait_for_transaction_receipt(h)
    addr = rcpt.contractAddress

    client = INFTClient(
        w3=w3, address=addr, admin_account=admin, chain_id=31337,
    )
    yield client, oracle, addr


@pytest.mark.asyncio
async def test_mint_then_is_authorized(deployed):
    client, _, _ = deployed
    holder = Account.create().address
    token_id = await client.mint(
        to=holder,
        metadata_hash=b"\x00" * 32,
        metadata_uri="0g://x",
        sealed_key=b"\x01",
    )
    assert token_id == 1
    assert await client.is_authorized(token_id=token_id, user=holder) is True
    assert await client.owner_of(token_id) == holder


@pytest.mark.asyncio
async def test_pool_returns_stored_fields(deployed):
    client, _, _ = deployed
    holder = Account.create().address
    h = b"\xaa" * 32
    token_id = await client.mint(
        to=holder,
        metadata_hash=h,
        metadata_uri="0g://m",
        sealed_key=b"\xbb\xcc",
    )
    metadata_hash, metadata_uri, sealed = await client.pool(token_id)
    assert metadata_hash == h
    assert metadata_uri == "0g://m"
    assert bytes(sealed) == b"\xbb\xcc"
