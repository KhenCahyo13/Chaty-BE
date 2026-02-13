alter table if exists users
    add column if not exists is_online boolean not null default false,
    add column if not exists last_seen_at timestamp with time zone not null default now();

create index if not exists idx_users_is_online on users (is_online);
create index if not exists idx_users_last_seen_at on users (last_seen_at desc);
