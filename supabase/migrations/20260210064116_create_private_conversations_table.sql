create table
    if not exists private_conversations (
        id uuid primary key default gen_random_uuid (),
        user_1_id uuid not null references users (id) on update cascade on delete cascade,
        user_2_id uuid not null references users (id) on update cascade on delete cascade,
        created_at timestamp with time zone default now (),
        updated_at timestamp with time zone default now (),
        unique (user_1_id, user_2_id)
    );