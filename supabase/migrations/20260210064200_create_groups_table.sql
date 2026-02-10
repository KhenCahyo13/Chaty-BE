create table
    if not exists groups (
        id uuid primary key default gen_random_uuid (),
        owner_id uuid not null references users (id) on update cascade on delete cascade,
        name varchar(150) not null,
        description text,
        avatar_url text,
        created_at timestamp with time zone default now (),
        updated_at timestamp with time zone default now ()
    );
