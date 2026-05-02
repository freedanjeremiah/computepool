from typing import Optional

from eth_account import Account
from web3 import AsyncWeb3

from ._abi import POOL_INFT_ABI


class INFTClient:
    def __init__(
        self,
        *,
        w3: AsyncWeb3,
        address: str,
        admin_account: Account,
        chain_id: int = 16602,
        gas: int = 800_000,
    ):
        self.w3 = w3
        self.contract = w3.eth.contract(address=address, abi=POOL_INFT_ABI)
        self.admin = admin_account
        self.chain_id = chain_id
        self.gas = gas

    async def _send(self, fn, *, sender_account: Optional[Account] = None) -> dict:
        sender = sender_account or self.admin
        nonce = await self.w3.eth.get_transaction_count(sender.address)
        tx = await fn.build_transaction({
            "from": sender.address,
            "chainId": self.chain_id,
            "nonce": nonce,
            "gas": self.gas,
            "maxFeePerGas": int(2e9),
            "maxPriorityFeePerGas": int(2e9),
        })
        signed = sender.sign_transaction(tx)
        h = await self.w3.eth.send_raw_transaction(signed.raw_transaction)
        return await self.w3.eth.wait_for_transaction_receipt(h)

    async def mint(
        self,
        *,
        to: str,
        metadata_hash: bytes,
        metadata_uri: str,
        sealed_key: bytes,
    ) -> int:
        receipt = await self._send(
            self.contract.functions.mint(to, metadata_hash, metadata_uri, sealed_key)
        )
        ev = self.contract.events.PoolMinted().process_receipt(receipt)
        return int(ev[0]["args"]["tokenId"])

    async def is_authorized(self, *, token_id: int, user: str) -> bool:
        return await self.contract.functions.isAuthorized(token_id, user).call()

    async def authorize_usage(
        self,
        *,
        token_id: int,
        user: str,
        expires_at: int,
        owner_account: Account,
    ) -> dict:
        return await self._send(
            self.contract.functions.authorizeUsage(token_id, user, expires_at),
            sender_account=owner_account,
        )

    async def transfer_with_proof(
        self,
        *,
        token_id: int,
        to: str,
        new_metadata_uri: str,
        new_sealed_key: bytes,
        oracle_sig: bytes,
        owner_account: Account,
    ) -> dict:
        return await self._send(
            self.contract.functions.transferWithProof(
                token_id, to, new_metadata_uri, new_sealed_key, oracle_sig
            ),
            sender_account=owner_account,
        )

    async def owner_of(self, token_id: int) -> str:
        return await self.contract.functions.ownerOf(token_id).call()

    async def pool(self, token_id: int) -> tuple[bytes, str, bytes]:
        return await self.contract.functions.pools(token_id).call()
