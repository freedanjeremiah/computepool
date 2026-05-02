"""OpenAI-compatible request/response shapes for ComputePool.

Only the schema lives here for now. Routes (`/v1/models`, `/v1/chat/completions`)
land in subsequent tasks.
"""
from typing import Literal, Optional

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class ChatCompletionsRequest(BaseModel):
    model: str
    messages: list[ChatMessage]
    stream: bool = False
    temperature: float = 0.7
    max_tokens: int = Field(default=256, gt=0, le=4096)
    top_p: Optional[float] = None


class ChatCompletionsChoice(BaseModel):
    index: int = 0
    message: ChatMessage
    finish_reason: Literal["stop", "length"]


class ChatCompletionsUsage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class ChatCompletionsResponse(BaseModel):
    id: str
    object: Literal["chat.completion"] = "chat.completion"
    created: int
    model: str
    choices: list[ChatCompletionsChoice]
    usage: ChatCompletionsUsage
