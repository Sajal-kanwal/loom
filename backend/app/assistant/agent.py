"""PydanticAI document agent definition."""

from __future__ import annotations

from pathlib import Path

from pydantic_ai import Agent, UsageLimits
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.google import GoogleProvider
from pydantic_ai.providers.openai import OpenAIProvider

from app.assistant.deps import DocumentAgentDeps
from app.assistant.outputs import GroundedAnswer
from app.assistant.status import emit_agent_done, emit_agent_start
from app.assistant.tools import (
    read_chunk,
    read_chunks,
    read_surrounding_chunks,
    search_filings,
)
from app.config import settings

_INSTRUCTIONS_PATH = Path(__file__).with_name("instructions.md")
INSTRUCTIONS = _INSTRUCTIONS_PATH.read_text(encoding="utf-8")

def _create_agent_for_model(model_name: str) -> Agent[DocumentAgentDeps, GroundedAnswer]:
    if model_name.startswith("gemini"):
        model = GoogleModel(
            model_name,
            provider=GoogleProvider(api_key=settings.openai_api_key),
        )
    else:
        model = OpenAIChatModel(
            model_name,
            provider=OpenAIProvider(
                api_key=settings.openai_api_key,
                base_url=settings.openai_base_url,
            ),
        )
    return Agent(
        model,
        deps_type=DocumentAgentDeps,
        output_type=GroundedAnswer,
        instructions=INSTRUCTIONS,
        tools=[search_filings, read_chunks, read_chunk, read_surrounding_chunks],
    )


def get_document_agent() -> Agent[DocumentAgentDeps, GroundedAnswer]:
    return _create_agent_for_model(settings.openai_chat_model)


def run_document_agent(query: str, deps: DocumentAgentDeps) -> GroundedAnswer:
    models_to_try = [
        settings.openai_chat_model,
        "gemini-3.5-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-3.5-flash",
    ]
    unique_models: list[str] = []
    for m in models_to_try:
        if m not in unique_models:
            unique_models.append(m)

    last_exc: Exception | None = None
    for model_name in unique_models:
        try:
            emit_agent_start(
                deps,
                model=model_name,
                request_limit=settings.openai_agent_request_limit,
            )
            agent = _create_agent_for_model(model_name)
            result = agent.run_sync(
                query,
                deps=deps,
                usage_limits=UsageLimits(request_limit=settings.openai_agent_request_limit),
            )
            usage = result.usage
            emit_agent_done(
                deps,
                requests=usage.requests or 0,
                tool_calls=usage.tool_calls or 0,
                input_tokens=usage.input_tokens,
                output_tokens=usage.output_tokens,
            )
            return result.output
        except Exception as exc:
            last_exc = exc
            continue

    if last_exc:
        raise last_exc
    raise RuntimeError("Failed to run document agent.")
