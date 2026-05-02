from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Mongo
    mongodb_uri: str
    mongodb_db: str = "discom"

    # KeeperHub
    keeperhub_api_key: str
    keeperhub_base_url: str = "https://api.keeperhub.com"
    keeperhub_webhook_secret: str
    kh_workflow_coalition_form: str
    kh_workflow_stream_start: str
    kh_workflow_stream_stop: str
    kh_workflow_handle_breach: str

    # Chain
    sepolia_rpc_url: str
    chain_id: int = 11155111
    usdc_address: str = Field(..., pattern=r"^0x[0-9a-fA-F]{40}$")
    usdcx_address: str = Field(..., pattern=r"^0x[0-9a-fA-F]{40}$")
    coalition_address: str = Field(..., pattern=r"^0x[0-9a-fA-F]{40}$")
    cfa_v1_forwarder: str = "0xcfA132E353cB4E398080B9700609bb008eceB125"
    gda_v1_forwarder: str = "0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08"

    # Orchestrator wallet (payee)
    orchestrator_wallet_address: str = Field(..., pattern=r"^0x[0-9a-fA-F]{40}$")

    # x402
    x402_facilitator_url: str = "http://facilitator:4021"
    x402_default_price_per_token_usdc_micro: int = 100

    # Public URL
    public_url: str

    # Inference timing for flow-rate estimation
    seconds_per_token_estimate: float = 0.4


@lru_cache
def get_settings() -> Settings:
    return Settings()
