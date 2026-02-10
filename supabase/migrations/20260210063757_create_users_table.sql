create table
    if not exists users (
        id uuid primary key default gen_random_uuid (),
        username varchar(100) not null unique,
        email varchar(255) not null unique,
        password varchar(255) not null,
        created_at timestamp with time zone default now(),
        updated_at timestamp with time zone default now()
    );