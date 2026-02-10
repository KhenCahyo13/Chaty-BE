create table
    if not exists group_messages (
        id uuid primary key default gen_random_uuid (),
        group_id uuid not null references groups (id) on update cascade on delete cascade,
        sender_id uuid not null references users (id) on update cascade on delete cascade,
        content text,
        type varchar(10) not null check (type in ('text', 'image', 'file')),
        is_deleted boolean default false,
        created_at timestamp with time zone default now (),
        updated_at timestamp with time zone default now ()
    );
