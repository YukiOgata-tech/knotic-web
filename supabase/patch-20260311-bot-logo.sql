-- Add bot logo and launcher label display toggle

alter table public.bots
  add column if not exists bot_logo_url text,
  add column if not exists launcher_show_label boolean not null default true;

-- Public storage bucket for bot logos (must be accessible from external sites via Widget)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bot-logos',
  'bot-logos',
  true,
  2097152,  -- 2MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do nothing;

-- Allow public read of bot logos
create policy "bot logos public read"
  on storage.objects for select
  using (bucket_id = 'bot-logos');
