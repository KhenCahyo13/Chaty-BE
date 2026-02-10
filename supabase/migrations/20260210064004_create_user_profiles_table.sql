create table
    if not exists user_profiles (
        id uuid primary key default gen_random_uuid (),
        user_id uuid not null unique references users (id) on update cascade on delete cascade,
        full_name varchar(255) not null,
        about varchar(100),
        avatar_url text,
        created_at timestamp with time zone default now(),
        updated_at timestamp with time zone default now()
    );