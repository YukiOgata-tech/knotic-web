-- Normalize legacy short model names to current OpenAI model ids.
-- Current tier mapping:
--   Knotic Standard -> gpt-5-mini
--   Knotic Mini     -> gpt-5-nano
--   Knotic Nano     -> gpt-4o-mini

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'bots_ai_model_ck') then
    alter table public.bots drop constraint bots_ai_model_ck;
  end if;
  if exists (select 1 from pg_constraint where conname = 'bots_ai_fallback_model_ck') then
    alter table public.bots drop constraint bots_ai_fallback_model_ck;
  end if;
end
$$;

alter table public.bots
  alter column ai_model set default 'gpt-5-mini';

update public.bots
set
  ai_model = case ai_model
    when '5-nano' then 'gpt-5-nano'
    when '5-mini' then 'gpt-5-mini'
    when '5' then 'gpt-5-mini'
    when 'gpt-5' then 'gpt-5-mini'
    else ai_model
  end,
  ai_fallback_model = case ai_fallback_model
    when '5-nano' then 'gpt-5-nano'
    when '5-mini' then 'gpt-5-mini'
    when '5' then 'gpt-5-mini'
    when 'gpt-5' then 'gpt-5-mini'
    else ai_fallback_model
  end
where ai_model in ('5-nano', '5-mini', '5', 'gpt-5')
   or ai_fallback_model in ('5-nano', '5-mini', '5', 'gpt-5');
