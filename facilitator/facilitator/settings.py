from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    sepolia_rpc_url: str
    relayer_private_key: str = Field(..., pattern=r"^0x[0-9a-fA-F]{64}$")
    usdc_address: str = Field(..., pattern=r"^0x[0-9a-fA-F]{40}$")

    chain_id: int = 11155111
    usdc_decimals: int = 6
    confirmations: int = 1
    listen_port: int = 4021


@lru_cache
def get_settings() -> Settings:
    return Settings()
