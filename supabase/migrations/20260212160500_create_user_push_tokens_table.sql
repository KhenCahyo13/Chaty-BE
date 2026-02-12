create table
    if not exists user_push_tokens (
        id uuid primary key default gen_random_uuid (),
        user_id uuid not null references users (id) on update cascade on delete cascade,
        fcm_token text not null unique,
        platform varchar(20) not null,
        device_id varchar(255),
        is_active boolean not null default true,
        last_seen_at timestamp with time zone default now(),
        created_at timestamp with time zone default now(),
        updated_at timestamp with time zone default now()
    );

create index if not exists idx_user_push_tokens_user_active on user_push_tokens (user_id, is_active);
create index if not exists idx_user_push_tokens_device_id on user_push_tokens (device_id);
