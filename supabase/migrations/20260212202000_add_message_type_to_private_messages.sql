do $$
begin
    create type "MessageType" as enum ('TEXT', 'AUDIO', 'FILE');
exception
    when duplicate_object then null;
end
$$;

alter table private_messages
add column if not exists message_type "MessageType" not null default 'TEXT';

alter table private_messages
alter column content drop not null;