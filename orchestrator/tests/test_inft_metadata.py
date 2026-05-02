import json
import hashlib

from orchestrator.inft.metadata import canonical_dumps, content_hash, PoolMetadata


def test_canonical_is_stable():
    a = PoolMetadata(
        model_id="m", hf_revision="r", total_layers=2,
        split={"entry": [0, 1], "exit": [1, 2]},
        axl_pubkeys={"entry": "0x1", "exit": "0x2"},
        orchestrator_signer="0x3",
    )
    s1 = canonical_dumps(a)
    s2 = canonical_dumps(PoolMetadata(**json.loads(s1)))
    assert s1 == s2


def test_content_hash_is_sha256_of_canonical():
    m = PoolMetadata(
        model_id="m", hf_revision="r", total_layers=2,
        split={"entry": [0, 1], "exit": [1, 2]},
        axl_pubkeys={"entry": "0x1", "exit": "0x2"},
        orchestrator_signer="0x3",
    )
    assert content_hash(m) == hashlib.sha256(canonical_dumps(m).encode()).digest()


def test_optional_hf_token_serializes():
    m = PoolMetadata(
        model_id="m", hf_revision="r", total_layers=2,
        split={"entry": [0, 1], "exit": [1, 2]},
        axl_pubkeys={"entry": "0x1", "exit": "0x2"},
        orchestrator_signer="0x3",
        hf_token="hf_secret",
    )
    s = canonical_dumps(m)
    assert '"hf_token":"hf_secret"' in s
