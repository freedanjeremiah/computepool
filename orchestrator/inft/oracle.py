from eth_account import Account
from eth_account.messages import encode_defunct
from web3 import Web3

_TRANSFER_TAG = Web3.keccak(text="CPPOOL_TRANSFER")
_CLONE_TAG = Web3.keccak(text="CPPOOL_CLONE")


def sign_transfer_proof(
    *,
    oracle_privkey: bytes,
    token_id: int,
    to: str,
    new_metadata_uri: str,
    new_sealed_key: bytes,
) -> bytes:
    """Produce an EIP-191 personal_sign over the transfer digest defined in PoolINFT.sol."""
    digest = Web3.solidity_keccak(
        ["bytes32", "uint256", "address", "string", "bytes"],
        [_TRANSFER_TAG, token_id, to, new_metadata_uri, new_sealed_key],
    )
    return Account.sign_message(
        encode_defunct(primitive=digest), private_key=oracle_privkey
    ).signature


def sign_clone_proof(
    *,
    oracle_privkey: bytes,
    source_id: int,
    to: str,
    new_metadata_uri: str,
    new_sealed_key: bytes,
) -> bytes:
    """Produce an EIP-191 personal_sign over the clone digest defined in PoolINFT.sol."""
    digest = Web3.solidity_keccak(
        ["bytes32", "uint256", "address", "string", "bytes"],
        [_CLONE_TAG, source_id, to, new_metadata_uri, new_sealed_key],
    )
    return Account.sign_message(
        encode_defunct(primitive=digest), private_key=oracle_privkey
    ).signature
