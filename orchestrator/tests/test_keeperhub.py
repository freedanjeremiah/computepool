import pytest
from pytest_httpx import HTTPXMock
from orchestrator.keeperhub import KeeperHubClient, KeeperHubError, WorkflowInputs


@pytest.mark.asyncio
async def test_execute_workflow_success(httpx_mock: HTTPXMock):
    httpx_mock.add_response(
        url="https://api.keeperhub.com/workflows/wf_xxx/run",
        json={"data": {"executionId": "exec_1", "status": "running"}},
    )
    kh = KeeperHubClient(api_key="kh_test", base_url="https://api.keeperhub.com")
    out = await kh.execute_workflow("wf_xxx", inputs={"foo": "bar"})
    assert out["executionId"] == "exec_1"
    await kh.aclose()


@pytest.mark.asyncio
async def test_execute_workflow_propagates_http_error(httpx_mock: HTTPXMock):
    httpx_mock.add_response(
        url="https://api.keeperhub.com/workflows/wf_xxx/run",
        status_code=400,
        json={"error": "bad input"},
    )
    kh = KeeperHubClient(api_key="kh_test", base_url="https://api.keeperhub.com")
    with pytest.raises(KeeperHubError) as ei:
        await kh.execute_workflow("wf_xxx", inputs={})
    assert ei.value.http_status == 400
    await kh.aclose()


def test_workflow_inputs_coalition_form_shape():
    out = WorkflowInputs.coalition_form(
        session_id="s1",
        participants=["0xa", "0xb"],
        terms_hash="0x" + "ab" * 32,
        deadline_unix=1000,
        stake_token="0xCC",
        stake_per_party="1000000",
        callback_url="https://x/cb",
    )
    assert out["session_id"] == "s1"
    assert out["participants"] == ["0xa", "0xb"]
    assert out["callback_url"] == "https://x/cb"
