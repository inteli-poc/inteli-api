# inteli-api

Inteli OpenAPI service for interacting with the DSCP (Digital Supply-Chain Platform)

## Environment Variables

`inteli-api` is configured primarily using environment variables as follows:

| variable                     | required |                       default                       | description                                                                          |
| :--------------------------- | :------: | :-------------------------------------------------: | :----------------------------------------------------------------------------------- |
| SERVICE_TYPE                 |    N     |                       `info`                        | Logging level. Valid values are [`trace`, `debug`, `info`, `warn`, `error`, `fatal`] |
| PORT                         |    N     |                       `3001`                        | The port for the API to listen on                                                    |
| LOG_LEVEL                    |    N     |                       `info`                        | Logging level. Valid values are [`trace`, `debug`, `info`, `warn`, `error`, `fatal`] |
| API_VERSION                  |    N     |                          -                          | API version                                                                          |
| API_MAJOR_VERSION            |    N     |                          -                          | API major version                                                                    |
| DB_HOST                      |    Y     |                          -                          | PostgreSQL database hostname                                                         |
| DB_PORT                      |    N     |                       `5432`                        | PostgreSQL database port                                                             |
| DB_NAME                      |    N     |                      `inteli`                       | PostgreSQL database name                                                             |
| DB_USERNAME                  |    Y     |                          -                          | PostgreSQL database username                                                         |
| DB_PASSWORD                  |    Y     |                          -                          | PostgreSQL database password                                                         |
| FILE_UPLOAD_SIZE_LIMIT_BYTES |    N     |                 `1024 * 1024 * 100`                 | Maximum file size in bytes for upload                                                |
| AUTH_JWKS_URI                |    N     | `https://inteli.eu.auth0.com/.well-known/jwks.json` | JSON Web Key Set containing public keys used by the Auth0 API                        |
| AUTH_AUDIENCE                |    N     |                    `inteli-dev`                     | Identifier of the Auth0 API                                                          |
| AUTH_ISSUER                  |    N     |           `https://inteli.eu.auth0.com/`            | Domain of the Auth0 API `                                                            |
| AUTH_TOKEN_URL               |    N     |      `https://inteli.eu.auth0.com/oauth/token`      | Auth0 API endpoint that issues an Authorisation (Bearer) access token                |

### `Orders`

`orders` is where orders for orders are stored

#### Columns

| column         | PostgreSQL type           | nullable |       default        | description                                           |
| :------------- | :------------------------ | :------- | :------------------: | :---------------------------------------------------- |
| `id`           | `UUID`                    | FALSE    | `uuid_generate_v4()` | Unique identifier for the                             |
| `owner`        | `CHARACTER VARYING (255)` | FALSE    |                      | The name of owner                                     |
| `manufacturer` | `CHARACTER VARYING (255)` | FALSE    |                      | The name of manufacturer                              |
| `status`       | `ENUM`                    | FALSE    |                      | Can be 'Submitted', 'Rejected', 'Amended', 'Accepted' |
| `items`        | `jsonB`                   | FALSE    |                      |                                                       |
| `required_by`  | `DateTime`                | FALSE    |
| `created_at`   | `Timestamp with timezone` | FALSE    |                      | Timestamp the record was created                      |
| `updated_at`   | `Timestamp with timezone` | FALSE    |                      | Timestamp the record was updated                      |

#### Indexes

| columns | Index Type | description |
| :------ | :--------- | :---------- |
| `id`    | PRIMARY    | Primary key |

## Getting started

To start dependencies

```
docker-compose up -d
```

Run DB migrations

```
npx knex migrate:latest --env test
```

Run the application in development mode:

```sh
npm run dev
```

## Authentication

The endpoints on `inteli-api` require Bearer Authentication using a JSON Web Token. Tokens are generated externally as an Auth0 Machine to Machine token. You will need to create your own Auth0 API, which can be done for free, and set the appropriate [environment variables](#configuration) (those prefixed with `AUTH`). Follow the start of this [tutorial](https://auth0.com/docs/quickstart/backend/nodejs#configure-auth0-apis) to create an API. Go [here](app/routes/auth.js) and [here](app/auth.js) to see where the environment variables are used.
