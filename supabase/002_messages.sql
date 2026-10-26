-- Adds notices (overview "Mitteilungen") and the Administrator's messages to
-- Dr. Maynard as entry kinds. Run once in the Supabase SQL editor after
-- schema.sql. The access rules of public.entries apply unchanged.

alter table public.entries drop constraint if exists entries_kind_check;
alter table public.entries add constraint entries_kind_check
  check (kind in ('scp', 'personnel', 'report', 'mtf', 'goi', 'notice', 'message'));

-- the three notices that used to be in the code; the highest position is shown first
insert into public.entries (kind, id, position, data) values
('notice', 'N-0001', 2, '{"id":"N-0001","time":"Heute 02:00","level":"info","title":"Wartung","text":"SCiPnet-Wartung von 02:00 bis 03:00 Uhr."}'::jsonb),
('notice', 'N-0002', 1, '{"id":"N-0002","time":"Gestern","level":"warn","title":"Sicherheit","text":"Anmeldungen nur von zugelassenen Endpunkten."}'::jsonb),
('notice', 'N-0003', 0, '{"id":"N-0003","time":"14.09.","level":"alert","title":"Sperrung","text":"Archiv 7 bis auf Weiteres gesperrt."}'::jsonb)
on conflict (kind, id) do nothing;
