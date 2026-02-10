create extension if not exists pgcrypto with schema extensions;

insert into
    users (username, email, password)
values
    (
        'alice',
        'alice@example.com',
        extensions.crypt('password123', extensions.gen_salt('bf'))
    ),
    (
        'bob',
        'bob@example.com',
        extensions.crypt('password123', extensions.gen_salt('bf'))
    ),
    (
        'carol',
        'carol@example.com',
        extensions.crypt('password123', extensions.gen_salt('bf'))
    ),
    (
        'dave',
        'dave@example.com',
        extensions.crypt('password123', extensions.gen_salt('bf'))
    ),
    (
        'erin',
        'erin@example.com',
        extensions.crypt('password123', extensions.gen_salt('bf'))
    );