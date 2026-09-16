-- supabase/setup.sql
-- Run this once in the Supabase project's SQL Editor (Table Editor won't let
-- you set RLS policies as cleanly). See docs/architecture/travel-tips-backend.md
-- for the full walkthrough, including creating the owner login user.

create table if not exists public.travel_tips (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  categories jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Keep updated_at current on every write.
create or replace function public.set_travel_tips_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists travel_tips_set_updated_at on public.travel_tips;
create trigger travel_tips_set_updated_at
  before update on public.travel_tips
  for each row execute function public.set_travel_tips_updated_at();

-- Admin allowlist: which authenticated users may write to travel_tips.
-- This is defense-in-depth. Write access shouldn't depend solely on
-- "self-signup happens to be disabled" in the Supabase dashboard, since
-- this SQL can't verify or enforce that setting. Add the owner's user_id
-- below after creating their account (Authentication -> Users -> copy the
-- User UID).
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.admins enable row level security;

drop policy if exists "admins_self_read" on public.admins;
create policy "admins_self_read"
  on public.admins
  for select
  to authenticated
  using (auth.uid() = user_id);

alter table public.travel_tips enable row level security;

-- Public site (anon key) can only read.
drop policy if exists "travel_tips_public_read" on public.travel_tips;
create policy "travel_tips_public_read"
  on public.travel_tips
  for select
  to anon
  using (true);

-- Any signed-in user can read (same non-sensitive content as the public
-- policy above; reading isn't the sensitive operation here).
drop policy if exists "travel_tips_owner_read" on public.travel_tips;
create policy "travel_tips_owner_read"
  on public.travel_tips
  for select
  to authenticated
  using (true);

-- Writes are restricted to users listed in public.admins, not just anyone
-- who happens to be authenticated.
drop policy if exists "travel_tips_owner_insert" on public.travel_tips;
create policy "travel_tips_owner_insert"
  on public.travel_tips
  for insert
  to authenticated
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

drop policy if exists "travel_tips_owner_update" on public.travel_tips;
create policy "travel_tips_owner_update"
  on public.travel_tips
  for update
  to authenticated
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

drop policy if exists "travel_tips_owner_delete" on public.travel_tips;
create policy "travel_tips_owner_delete"
  on public.travel_tips
  for delete
  to authenticated
  using (exists (select 1 from public.admins where user_id = auth.uid()));

-- After creating the owner's login (Authentication -> Users -> Add user),
-- copy their User UID from that same screen and run:
--   insert into public.admins (user_id) values ('<paste-uid-here>');
-- Without this row, the owner can log in but every write will be rejected
-- by RLS (see travel_tips_owner_insert/update/delete above).

-- One-time seed of the existing lib/travelTips.json content. Safe to
-- re-run: skips rows whose slug already exists.
insert into public.travel_tips (slug, title, categories) values
  ('everest-base-camp-trek', 'Mount Everest Base Camp Trek', '[{"title":"Gear & Shopping","items":[{"label":"Procurement Strategy","detail":"Shop high-performance alpine gear at Decathlon in Chennai, India, to save costs compared to Sri Lanka, then supplement missing items in Kathmandu''s Thamel district."},{"label":"Layering System","detail":"Pack 4–6 sets of thermal base layers, lightweight micro-fleece mid-layers, and a heavy down jacket rated for -10°C to -15°C with a waterproof shell."},{"label":"Footwear & Bottoms","detail":"Use high-altitude, ankle-support waterproof boots rated for sub-zero temperatures, paired with fleece-lined winter trekking trousers and waterproof rain pants."},{"label":"Backpack & Camp Gear","detail":"Carry a 50L–70L ergonomic backpack with hip support, rain covers, trekking poles, heavy-duty luggage padlocks, and a 4-season sub-zero sleeping bag."}]},{"title":"Physical Conditioning","items":[{"label":"Weight Management","detail":"Reduce excess body fat (the vlogger dropped from 84 kg to ~72 kg) to ease knee and joint strain during steep climbs."},{"label":"Cardio Base","detail":"Walk or run 10 km to 15 km daily for 1–2 months leading up to the trek."},{"label":"Strength & Core","detail":"Perform calisthenics (pull-ups, dips, and core workouts) to build endurance for carrying daypacks on prolonged ascents."}]},{"title":"Flight Routes & Luggage Rules","items":[{"label":"International Route","detail":"Fly Colombo (CMB) to Kathmandu (KTM) via transit hubs like Chennai (MAA), keeping a 2–4 hour buffer for Indian airport security."},{"label":"Lukla Domestic Flights","detail":"Fly from Kathmandu or Ramechhap Airport to Lukla (Tenzing-Hillary Airport) via regional carriers (Summit Air, Tara Air, Sita Air)."},{"label":"Strict Luggage Limits","detail":"Keep total luggage under 15 kg (maximum 10 kg checked duffle + 5 kg carry-on daypack)."},{"label":"Weather & Helicopter Backups","detail":"Flights are frequently canceled due to mountain weather; maintain an emergency cash/card buffer for charter helicopter transfers."}]},{"title":"Estimated Costs (Per Person)","items":[{"label":"International Return Flights (CMB ⇄ KTM)","detail":"~LKR 170,000 (~$560 USD)."},{"label":"Kathmandu Hotel Stays (2–3 Nights)","detail":"~LKR 45,000 (~$150 USD)."},{"label":"Standard 12-Day EBC Trek Package","detail":"~$1,390 – $1,500 USD (covers guide, porter, permits, teahouses, and meals)."},{"label":"Kathmandu ⇄ Lukla Flights","detail":"~$300 – $400 USD return."},{"label":"Daily On-Trail Out-of-Pocket Expenses","detail":"~$15 – $30 USD/day for hot showers, Wi-Fi access, device charging, and boiled drinking water."},{"label":"Local Nepal SIM Card","detail":"~$20 – $36 USD at Tribhuvan International Airport for data connectivity."}]},{"title":"Safety & Planning Rules","items":[{"label":"Certified Guides","detail":"Always hire licensed Sherpa guides for navigation, lodge bookings, and altitude monitoring."},{"label":"Buffer Days","detail":"Add 3–5 contingency days at the end of the trip to absorb flight cancellations at Lukla without missing international flights."},{"label":"Gradual Acclimatization","detail":"Strictly follow acclimatization rest days in Namche Bazaar and Dingboche rather than rushing the ascent."}]}]'::jsonb),
  ('ladakh-bike-tour', 'Ladakh - Bike Tour', '[]'::jsonb),
  ('annapurna-circuit-trek', 'Annapurna Circuit Trek', '[]'::jsonb)
on conflict (slug) do nothing;
