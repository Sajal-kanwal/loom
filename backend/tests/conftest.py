import os

# Ensure required environment variables exist during testing
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "dummy-anon-key")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "dummy-service-key")
os.environ.setdefault("DATABASE_URL", "postgresql://postgres:dummy@localhost:5432/postgres")
os.environ.setdefault("OPENAI_API_KEY", "dummy-key")
os.environ.setdefault("OPENAI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/")
os.environ.setdefault("OPENAI_EMBEDDING_MODEL", "gemini-embedding-001")
os.environ.setdefault("OPENAI_EMBEDDING_DIMENSIONS", "1536")
os.environ.setdefault("OPENAI_CHAT_MODEL", "gemini-2.5-flash")
os.environ.setdefault("OPENAI_GROUNDING_MODEL", "gemini-2.5-flash")
