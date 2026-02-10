create table
    if not exists private_message_reads (
        id uuid primary key default gen_random_uuid (),
        message_id uuid not null references private_messages (id) on update cascade on delete cascade,
        receiver_id uuid not null references users (id) on update cascade on delete cascade,
        read_at timestamp with time zone not null,
        unique (message_id, receiver_id)
    );
