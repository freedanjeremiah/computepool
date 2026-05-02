import pytest
from pydantic import ValidationError

from orchestrator.api.openai_compat import (
    ChatMessage,
    ChatCompletionsRequest,
    ChatCompletionsResponse,
    ChatCompletionsChoice,
    ChatCompletionsUsage,
)


def test_chat_completions_request_accepts_minimum_payload():
    req = ChatCompletionsRequest(
        model="p1",
        messages=[ChatMessage(role="user", content="hi")],
    )
    assert req.stream is False
    assert req.max_tokens == 256
    assert req.temperature == 0.7


def test_chat_completions_request_rejects_invalid_role():
    with pytest.raises(ValidationError):
        ChatMessage(role="banana", content="x")


def test_chat_completions_request_rejects_max_tokens_over_limit():
    with pytest.raises(ValidationError):
        ChatCompletionsRequest(
            model="p1",
            messages=[ChatMessage(role="user", content="hi")],
            max_tokens=99999,
        )


def test_chat_completions_response_round_trips():
    body = ChatCompletionsResponse(
        id="chatcmpl-x",
        created=1,
        model="p1",
        choices=[ChatCompletionsChoice(
            message=ChatMessage(role="assistant", content="hi back"),
            finish_reason="stop",
        )],
        usage=ChatCompletionsUsage(prompt_tokens=2, completion_tokens=3, total_tokens=5),
    )
    j = body.model_dump_json()
    again = ChatCompletionsResponse.model_validate_json(j)
    assert again.choices[0].message.content == "hi back"
