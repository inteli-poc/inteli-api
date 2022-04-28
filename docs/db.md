# Database usage

## Database migrations

Database migrations are handled using [`knex.js`](https://knexjs.org/) and can be migrated manually using the following commands:

```sh
npx knex migrate:latest # used to migrate to latest database version
npx knex migrate:up # used to migrate to the next database version
npx knex migrate:down # used to migrate to the previous database version
```

## Table structure

The following tables exist in the `inteli` database.

### `attachments`

`attachments` is a staging ground for files before they're uploaded to IPFS as part of on-chain token creation.

#### Columns

| column        | PostgreSQL type           | nullable |       default        | description                            |
| :------------ | :------------------------ | :------- | :------------------: | :------------------------------------- |
| `id`          | `UUID`                    | FALSE    | `uuid_generate_v4()` | Unique identifier for the `attachment` |
| `filename`    | `CHARACTER VARYING (50)`  | FALSE    |          -           | Attachment filename                    |
| `binary_blob` | `bytea`                   | FALSE    |          -           | Attachment file data as binary         |
| `created_at`  | `Timestamp with timezone` | FALSE    |       `now()`        | When the row was first created         |

#### Indexes

| columns | Index Type | description |
| :------ | :--------- | :---------- |
| `id`    | PRIMARY    | Primary key |
