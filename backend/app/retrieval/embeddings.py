"""Google GenAI query embedding for live retrieval."""

from __future__ import annotations

from google import genai

from app.config import settings


def _client() -> genai.Client:
    return genai.Client(api_key=settings.openai_api_key)


def embed_query(text: str) -> list[float]:
    response = _client().models.embed_content(
        model=settings.openai_embedding_model,
        contents=text,
    )
    if not response.embeddings or not response.embeddings[0].values:
        raise ValueError("Google GenAI returned no embedding values.")
    embedding = list(response.embeddings[0].values)
    expected_dims = settings.openai_embedding_dimensions
    if len(embedding) != expected_dims:
        raise ValueError(
            f"Expected embedding dimension {expected_dims}, got {len(embedding)}"
        )
    return embedding
