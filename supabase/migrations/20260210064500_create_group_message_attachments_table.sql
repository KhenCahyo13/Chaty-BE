create table
    if not exists group_message_attachments (
        id uuid primary key default gen_random_uuid (),
        message_id uuid not null references group_messages (id) on update cascade on delete cascade,
        file_name varchar(255) not null,
        file_url text not null,
        file_type char(10) not null,
        file_size bigint not null
    );
