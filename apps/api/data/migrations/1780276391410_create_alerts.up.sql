begin;

create table public.alerts (
  id            uuid          primary key default gen_random_uuid(),
  user_id       text          not null,
  symbol        text          not null,
  target_price  numeric(12,4) not null,
  fcm_token     text          not null,
  is_active     boolean       not null default true,
  triggered_at  timestamptz,
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now()
);

create index alerts_user_id_idx       on public.alerts (user_id);
create index alerts_symbol_active_idx on public.alerts (symbol, is_active);

commit;
