import json

from eth_account import Account
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


class SignOnChainRequest(BaseModel):
    coalition_onchain_id: int
    coalition_address: str
    stake_token: str
    stake_amount: str


class SignOnChainResponse(BaseModel):
    tx_hash: str
    signer: str


def _is_address(v: str) -> bool:
    if not isinstance(v, str):
        return False
    if not v.startswith("0x") or len(v) != 42:
        return False
    try:
        int(v, 16)
    except ValueError:
        return False
    return True


async def _ensure_stake_approved(
    w3: "AsyncWeb3",
    acct,
    stake_token: str,
    spender: str,
    amount: int,
) -> None:
    token = w3.eth.contract(
        address=AsyncWeb3.to_checksum_address(stake_token),
        abi=ERC20_APPROVE_ABI,
    )
    spender_cs = AsyncWeb3.to_checksum_address(spender)
    current = await token.functions.allowance(acct.address, spender_cs).call()
    if current >= amount:
        return
    fn = token.functions.approve(spender_cs, amount)
    tx = await fn.build_transaction({
        "from": acct.address,
        "nonce": await w3.eth.get_transaction_count(acct.address),
        "chainId": await w3.eth.chain_id,
    })
    try:
        est = await w3.eth.estimate_gas(tx)
        tx["gas"] = int(est * 1.2)
    except Exception:
        tx["gas"] = 100_000
    signed = acct.sign_transaction(tx)
    raw = getattr(signed, "raw_transaction", None) or getattr(signed, "rawTransaction", None)
    tx_hash = await w3.eth.send_raw_transaction(raw)
    receipt = await w3.eth.wait_for_transaction_receipt(tx_hash)
    if receipt["status"] != 1:
        raise HTTPException(500, f"approve tx reverted: {tx_hash.hex()}")


async def _submit_sign_onchain(
    coalition_onchain_id: int,
    coalition_address: str,
    stake_token: str,
    stake_amount: int,
) -> tuple[str, str]:
    settings = get_settings()
    w3 = AsyncWeb3(AsyncHTTPProvider(settings.sepolia_rpc_url))
    acct = Account.from_key(settings.worker_private_key)
    coalition_cs = AsyncWeb3.to_checksum_address(coalition_address)
    await _ensure_stake_approved(w3, acct, stake_token, coalition_cs, stake_amount)
    contract = w3.eth.contract(address=coalition_cs, abi=COALITION_SIGN_ABI)
    fn = contract.functions.sign(coalition_onchain_id)
    tx = await fn.build_transaction({
        "from": acct.address,
        "nonce": await w3.eth.get_transaction_count(acct.address),
        "chainId": await w3.eth.chain_id,
    })
    try:
        est = await w3.eth.estimate_gas(tx)
        tx["gas"] = int(est * 1.2)
    except Exception:
        tx["gas"] = 200_000
    signed = acct.sign_transaction(tx)
    raw = getattr(signed, "raw_transaction", None) or getattr(signed, "rawTransaction", None)
    tx_hash = await w3.eth.send_raw_transaction(raw)
    receipt = await w3.eth.wait_for_transaction_receipt(tx_hash)
    if receipt["status"] != 1:
        raise HTTPException(500, f"sign tx reverted: {tx_hash.hex()}")
    return tx_hash.hex(), acct.address


@router.post("/coalition/sign-onchain", response_model=SignOnChainResponse)
async def sign_onchain(req: SignOnChainRequest) -> SignOnChainResponse:
    if not _is_address(req.coalition_address):
        raise HTTPException(400, "coalition_address must be 0x + 40 hex chars")
    if not _is_address(req.stake_token):
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
