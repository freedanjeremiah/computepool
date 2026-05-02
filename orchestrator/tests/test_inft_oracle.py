from eth_account import Account
from eth_account.messages import encode_defunct
from web3 import Web3

from orchestrator.inft.oracle import sign_transfer_proof, sign_clone_proof


def test_transfer_proof_recovers_to_oracle():
    oracle = Account.create()
    sig = sign_transfer_proof(
        oracle_privkey=oracle.key,
        token_id=42,
        to="0x" + "11" * 20,
        new_metadata_uri="0g://feed",
        new_sealed_key=b"\x01\x02",
    )
    digest = Web3.solidity_keccak(
        ["bytes32", "uint256", "address", "string", "bytes"],
        [Web3.keccak(text="CPPOOL_TRANSFER"), 42, "0x" + "11" * 20, "0g://feed", b"\x01\x02"],
    )
    msg = encode_defunct(primitive=digest)
    recovered = Account.recover_message(msg, signature=sig)
    assert recovered.lower() == oracle.address.lower()


def test_clone_proof_recovers_to_oracle():
    oracle = Account.create()
    sig = sign_clone_proof(
        oracle_privkey=oracle.key,
        source_id=7,
        to="0x" + "22" * 20,
        new_metadata_uri="0g://beef",
        new_sealed_key=b"\xaa",
    )
    digest = Web3.solidity_keccak(
        ["bytes32", "uint256", "address", "string", "bytes"],
        [Web3.keccak(text="CPPOOL_CLONE"), 7, "0x" + "22" * 20, "0g://beef", b"\xaa"],
    )
    msg = encode_defunct(primitive=digest)
    recovered = Account.recover_message(msg, signature=sig)
    assert recovered.lower() == oracle.address.lower()
