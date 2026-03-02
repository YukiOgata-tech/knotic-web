-- Drop legacy vector-RAG objects (File Search-only operation)
-- Safe to re-run.

-- 1) Legacy retrieval function
DROP FUNCTION IF EXISTS app.match_chunks(vector, uuid, uuid, integer);

-- 2) Legacy vector tables
DROP TABLE IF EXISTS public.embeddings CASCADE;
DROP TABLE IF EXISTS public.chunks CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;

-- 3) Drop pgvector extension only when no vector columns remain.
DO $$
DECLARE
  vector_col_count integer;
BEGIN
  SELECT count(*) INTO vector_col_count
  FROM information_schema.columns
  WHERE udt_name = 'vector';

  IF vector_col_count = 0 THEN
    BEGIN
      EXECUTE 'DROP EXTENSION IF EXISTS vector';
    EXCEPTION WHEN others THEN
      -- keep extension if another dependency still exists
      NULL;
    END;
  END IF;
END
$$;
