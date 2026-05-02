import json

from eth_account import Account
from eth_utils import is_address
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from web3 import AsyncHTTPProvider, AsyncWeb3

from .settings import get_settings


router = APIRouter()


COALITION_SIGN_ABI = json.loads("""[
  {"name":"sign","type":"function","stateMutability":"nonpayable",
   "inputs":[{"name":"coalitionId","type":"uint256"}],"outputs":[]}
]""")


ERC20_APPROVE_ABI = json.loads("""[
  {"name":"allowance","type":"function","stateMutability":"view",
   "inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],
   "outputs":[{"type":"uint256"}]},
  {"name":"approve","type":"function","stateMutability":"nonpayable",
   "inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],
   "outputs":[{"type":"bool"}]}
]""")


GDA_FORWARDER_ABI = json.loads("""[
  {"name":"connectPool","type":"function","stateMutability":"nonpayable",
   "inputs":[
     {"name":"pool","type":"address"},
     {"name":"userData","type":"bytes"}
   ],"outputs":[{"type":"bool"}]}
]""")


_w3: AsyncWeb3 | None = None
_acct = None


def _get_w3() -> AsyncWeb3:
    global _w3
    if _w3 is None:
        _w3 = AsyncWeb3(AsyncHTTPProvider(get_settings().sepolia_rpc_url))
    return _w3


def _get_acct():
    global _acct
    if _acct is None:
        _acct = Account.from_key(get_settings().worker_private_key)
    return _acct


async def _send_tx(w3: AsyncWeb3, acct, fn, *, default_gas: int) -> str:
    """Build, sign, broadcast, wait for receipt; raise on revert."""
    tx = await fn.build_transaction({
        "from": acct.address,
        "nonce": await w3.eth.get_transaction_count(acct.address),
        "chainId": await w3.eth.chain_id,
    })
    try:
        est = await w3.eth.estimate_gas(tx)
        tx["gas"] = int(est * 1.2)
    except Exception:
        tx["gas"] = default_gas
    signed = acct.sign_transaction(tx)
    raw = getattr(signed, "raw_transaction", None) or getattr(signed, "rawTransaction", None)
    tx_hash = await w3.eth.send_raw_transaction(raw)
    receipt = await w3.eth.wait_for_transaction_receipt(tx_hash)
    if receipt["status"] != 1:
        raise HTTPException(500, f"tx reverted: {tx_hash.hex()}")
    return tx_hash.hex()


class SignOnChainRequest(BaseModel):
    coalition_onchain_id: int
    coalition_address: str
    stake_token: str
    stake_amount: str


class SignOnChainResponse(BaseModel):
    tx_hash: str
    signer: str


async def _ensure_stake_approved(
    w3: AsyncWeb3, acct, stake_token: str, spender: str, amount: int,
) -> None:
    token = w3.eth.contract(
        address=AsyncWeb3.to_checksum_address(stake_token),
        abi=ERC20_APPROVE_ABI,
    )
    spender_cs = AsyncWeb3.to_checksum_address(spender)
    current = await token.functions.allowance(acct.address, spender_cs).call()
    if current >= amount:
        return
    await _send_tx(w3, acct, token.functions.approve(spender_cs, amount), default_gas=100_000)


async def _submit_sign_onchain(
    coalition_onchain_id: int,
    coalition_address: str,
    stake_token: str,
    stake_amount: int,
) -> tuple[str, str]:
    w3 = _get_w3()
    acct = _get_acct()
    coalition_cs = AsyncWeb3.to_checksum_address(coalition_address)
    await _ensure_stake_approved(w3, acct, stake_token, coalition_cs, stake_amount)
    contract = w3.eth.contract(address=coalition_cs, abi=COALITION_SIGN_ABI)
    tx_hash = await _send_tx(
        w3, acct, contract.functions.sign(coalition_onchain_id), default_gas=200_000,
    )
    return tx_hash, acct.address


class ConnectPoolRequest(BaseModel):
    pool_address: str


class ConnectPoolResponse(BaseModel):
    tx_hash: str


async def _submit_connect_pool(pool_address: str) -> str:
    w3 = _get_w3()
    acct = _get_acct()
    forwarder = w3.eth.contract(
        address=AsyncWeb3.to_checksum_address(get_settings().gda_v1_forwarder),
        abi=GDA_FORWARDER_ABI,
    )
    fn = forwarder.functions.connectPool(AsyncWeb3.to_checksum_address(pool_address), b"")
    return await _send_tx(w3, acct, fn, default_gas=200_000)


@router.post("/coalition/connect-pool", response_model=ConnectPoolResponse)
async def connect_pool(req: ConnectPoolRequest) -> ConnectPoolResponse:
    if not is_address(req.pool_address):
        raise HTTPException(400, "pool_address must be 0x + 40 hex chars")
    tx_hash = await _submit_connect_pool(req.pool_address)
    return ConnectPoolResponse(tx_hash=tx_hash)


@router.post("/coalition/sign-onchain", response_model=SignOnChainResponse)
async def sign_onchain(req: SignOnChainRequest) -> SignOnChainResponse:
    if not is_address(req.coalition_address):
        raise HTTPException(400, "coalition_address must be 0x + 40 hex chars")
    if not is_address(req.stake_token):
        raise HTTPException(400, "stake_token must be 0x + 40 hex chars")
    try:
        amount = int(req.stake_amount)
    except (TypeError, ValueError):
        raise HTTPException(400, "stake_amount must be a base-10 integer string")
    if amount < 0:
        raise HTTPException(400, "stake_amount must be non-negative")
    tx_hash, signer = await _submit_sign_onchain(
        req.coalition_onchain_id,
        req.coalition_address,
        req.stake_token,
        amount,
    )
    return SignOnChainResponse(tx_hash=tx_hash, signer=signer)
