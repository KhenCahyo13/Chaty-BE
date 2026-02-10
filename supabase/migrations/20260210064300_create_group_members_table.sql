create table
    if not exists group_members (
        id uuid primary key default gen_random_uuid (),
        group_id uuid not null references groups (id) on update cascade on delete cascade,
        user_id uuid not null references users (id) on update cascade on delete cascade,
        is_admin boolean default false,
        joined_at timestamp with time zone default now (),
        last_read_at timestamp with time zone default now (),
        unique (group_id, user_id)
    );
