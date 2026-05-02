import hashlib
import json
from typing import Optional

from pydantic import BaseModel, Field


class PoolMetadata(BaseModel):
    model_id: str
    hf_revision: str
    total_layers: int
    split: dict[str, list[int]]   # {"entry": [s, m], "exit": [m, e]}
    axl_pubkeys: dict[str, str]   # {"entry": "0x...", "exit": "0x..."}
    orchestrator_signer: str
    hf_token: Optional[str] = Field(default=None, description="optional gated-HF token")


def canonical_dumps(m: PoolMetadata) -> str:
    """Sort keys, no whitespace — stable across Python runs."""
    return json.dumps(m.model_dump(exclude_none=False), sort_keys=True, separators=(",", ":"))


def content_hash(m: PoolMetadata) -> bytes:
    return hashlib.sha256(canonical_dumps(m).encode()).digest()
