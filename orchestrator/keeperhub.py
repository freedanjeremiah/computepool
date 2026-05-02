import httpx
from typing import Any


class KeeperHubError(Exception):
    def __init__(self, code: str, http_status: int, body: Any = None):
        self.code = code
        self.http_status = http_status
        self.body = body
        super().__init__(f"[{code} http={http_status}] {body}")


class KeeperHubClient:
    def __init__(self, api_key: str, base_url: str = "https://api.keeperhub.com",
                 timeout: float = 30.0):
        self._http = httpx.AsyncClient(
            base_url=base_url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            timeout=timeout,
        )

    async def aclose(self):
        await self._http.aclose()

    async def execute_workflow(self, workflow_id: str, inputs: dict) -> dict:
        r = await self._http.post(f"/workflows/{workflow_id}/run", json={"inputs": inputs})
        if r.status_code >= 400:
            try:
                body = r.json()
            except Exception:
                body = r.text
            raise KeeperHubError("KH_HTTP", r.status_code, body)
        return r.json().get("data", r.json())

    async def get_execution(self, execution_id: str) -> dict:
        r = await self._http.get(f"/executions/{execution_id}")
        if r.status_code >= 400:
            try:
                body = r.json()
            except Exception:
                body = r.text
            raise KeeperHubError("KH_HTTP", r.status_code, body)
        return r.json().get("data", r.json())


class WorkflowInputs:
    @staticmethod
    def coalition_form(*, session_id: str, participants: list[str], terms_hash: str,
                       deadline_unix: int, stake_token: str, stake_per_party: str,
                       callback_url: str) -> dict:
        return {
            "session_id": session_id,
            "participants": participants,
            "terms_hash": terms_hash,
            "deadline_unix": deadline_unix,
            "stake_token": stake_token,
            "stake_per_party": stake_per_party,
            "callback_url": callback_url,
        }

    @staticmethod
    def stream_start(*, session_id: str, super_token: str, pool_address: str,
                     flow_rate_wei_per_sec: str, total_budget_wei: str,
                     callback_url: str) -> dict:
        return {
            "session_id": session_id,
            "super_token": super_token,
            "pool_address": pool_address,
            "flow_rate_wei_per_sec": flow_rate_wei_per_sec,
            "total_budget_wei": total_budget_wei,
            "callback_url": callback_url,
        }

    @staticmethod
    def stream_stop(*, session_id: str, super_token: str, pool_address: str,
                    callback_url: str) -> dict:
        return {
            "session_id": session_id,
            "super_token": super_token,
            "pool_address": pool_address,
            "callback_url": callback_url,
        }
