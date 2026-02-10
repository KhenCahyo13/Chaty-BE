create table
    if not exists private_messages (
        id uuid primary key default gen_random_uuid (),
        private_conversation_id uuid not null references private_conversations (id) on update cascade on delete cascade,
        sender_id uuid not null references users (id) on update cascade on delete cascade,
        content text not null,
        type varchar(10) not null check (type in ('text', 'image', 'file')),
        is_deleted boolean default false,
        created_at timestamp with time zone default now (),
        updated_at timestamp with time zone default now ()
    );
