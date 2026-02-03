create table users (
                       id bigserial primary key,
                       username varchar(100) not null unique,
                       password_hash varchar(200) not null,
                       roles varchar(200) not null,
                       created_at timestamp not null default now()
);

create table products (
                          id bigserial primary key,
                          description varchar(200) not null,
                          quantity int not null,
                          deleted boolean not null default false,
                          deleted_at timestamp null,
                          created_at timestamp not null default now(),
                          updated_at timestamp not null default now()
);

create index idx_products_description on products (description);
create index idx_products_deleted on products (deleted);
