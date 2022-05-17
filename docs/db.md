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

### `recipes`

`recipes` is where recipes for orders are stored

#### Columns

| column              | PostgreSQL type           | nullable |       default        | description                            |
| :------------------ | :------------------------ | :------- | :------------------: | :------------------------------------- |
| `id`                | `UUID`                    | FALSE    | `uuid_generate_v4()` | Unique identifier for the `attachment` |
| `externalId`        | `CHARACTER VARYING (255)` | FALSE    |                      | The external id of the recipe          |
| `name`              | `CHARACTER VARYING (255)` | FALSE    |                      | The name of recipe                     |
| `imageAttachmentId` | `UUID`                    | FALSE    |                      | Id of attachment (FK)                  |
| `material`          | `CHARACTER VARYING (255)` | FALSE    |                      |                                        |
| `alloy`             | `CHARACTER VARYING (255)` | FALSE    |                      |                                        |
| `price`             | `CHARACTER VARYING (255)` | FALSE    |                      |                                        |
| `requiredCerts`     | `JSONB`                   | FALSE    |                      |                                        |
| `supplier`          | `CHARACTER VARYING (255)` | FALSE    |                      |                                        |
| `created_at`        | `Timestamp with timezone` | FALSE    |                      | Timestamp the record was created       |
| `updated_at`        | `Timestamp with timezone` | FALSE    |                      | Timestamp the record was updated       |

#### Indexes

| columns | Index Type | description |
| :------ | :--------- | :---------- |
| `id`    | PRIMARY    | Primary key |

#### Foreign Keys

| columns             | References     | description                  |
| :------------------ | :------------- | :--------------------------- |
| `imageAttachmentId` | attachment(id) | The id of the attachment row |

### `orders`

`orders` contains newly placed orders.

#### Columns

| column       | PostgreSQL type           | nullable |       default        | description                                                                         |
| :----------- | :------------------------ | :------- | :------------------: | :---------------------------------------------------------------------------------- | --- |
| `id`         | `UUID`                    | FALSE    | `uuid_generate_v4()` | Unique identifier for the `attachment`                                              |
| `supplier`   | `CHARACTER VARYING (255)` | FALSE    |          -           | Name of the supplier                                                                |
| `items`      | `UUID ARRAY`              | FALSE    |          -           | IDs of the supplier as supplied by the identity service function `getMemberByAlias` |
| `created_at` | `Timestamp with timezone` | FALSE    |                      | Timestamp the record was created                                                    |
| `updated_at` | `Timestamp with timezone` | FALSE    |                      | Timestamp the record was updated                                                    |     |

#### Indexes

| columns | Index Type | description |
| :------ | :--------- | :---------- |
| `id`    | PRIMARY    | Primary key |
