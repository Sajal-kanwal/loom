"""OpenAI embedding generation for document chunks."""

from __future__ import annotations

from openai import OpenAI

from app.config import settings

import re
import time
import openai

EMBED_BATCH_SIZE = 50


def _client() -> OpenAI:
    return OpenAI(
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
    )


def _embed_batch_with_retry(
    batch: list[str], expected_dims: int, max_retries: int = 10
) -> list[list[float]]:
    for attempt in range(max_retries):
        try:
            response = _client().embeddings.create(
                input=batch,
                model=settings.openai_embedding_model,
                dimensions=expected_dims,
            )
            ordered = (
                sorted(response.data, key=lambda item: item.index)
                if all(item.index is not None for item in response.data)
                else response.data
            )
            batch_vectors = []
            for item in ordered:
                embedding = item.embedding
                if len(embedding) != expected_dims:
                    raise ValueError(
                        f"Expected embedding dimension {expected_dims}, got {len(embedding)}"
                    )
                batch_vectors.append(embedding)
            return batch_vectors
        except openai.RateLimitError as e:
            if attempt == max_retries - 1:
                raise
            # Try to extract required delay from error message
            msg = str(e)
            delay_match = re.search(r"retry in ([\d\.]+)s", msg, re.IGNORECASE)
            if delay_match:
                wait_time = float(delay_match.group(1)) + 2.0
            else:
                wait_time = max(60.0, (2 ** attempt) * 2.0)
            print(f"Rate limited (429), waiting {wait_time:.1f}s before retry (attempt {attempt + 1}/{max_retries})...")
            time.sleep(wait_time)
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            wait_time = 5.0
            print(f"Embedding attempt failed ({e}), retrying in {wait_time}s...")
            time.sleep(wait_time)
    raise RuntimeError("Failed to embed batch after maximum retries")


def embed_texts(texts: list[str], *, batch_size: int = EMBED_BATCH_SIZE) -> list[list[float]]:
    if not texts:
        return []

    expected_dims = settings.openai_embedding_dimensions
    vectors: list[list[float]] = []

    for start in range(0, len(texts), batch_size):
        batch = texts[start : start + batch_size]
        batch_vectors = _embed_batch_with_retry(batch, expected_dims)
        vectors.extend(batch_vectors)
        time.sleep(0.3)

    return vectors
