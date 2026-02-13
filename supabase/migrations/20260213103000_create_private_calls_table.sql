create table
    if not exists private_calls (
        id uuid primary key default gen_random_uuid (),
        private_conversation_id uuid references private_conversations (id) on update cascade on delete set null,
        caller_id uuid not null references users (id) on update cascade on delete cascade,
        callee_id uuid not null references users (id) on update cascade on delete cascade,
        call_type varchar(20) not null default 'audio' check (call_type in ('audio', 'video')),
        status varchar(20) not null default 'initiated' check (
            status in ('initiated', 'ringing', 'answered', 'ended', 'missed', 'rejected', 'failed', 'cancelled')
        ),
        started_at timestamp with time zone default now (),
        ended_at timestamp with time zone,
        metadata jsonb,
        created_at timestamp with time zone default now (),
        updated_at timestamp with time zone default now (),
        check (caller_id <> callee_id),
        check (ended_at is null or ended_at >= started_at)
    );

create index if not exists idx_private_calls_conversation_created_at on private_calls (private_conversation_id, created_at desc);
create index if not exists idx_private_calls_caller_created_at on private_calls (caller_id, created_at desc);
create index if not exists idx_private_calls_callee_created_at on private_calls (callee_id, created_at desc);
create index if not exists idx_private_calls_status on private_calls (status);
