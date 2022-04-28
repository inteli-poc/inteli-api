# inteli-api

Inteli OpenAPI service for interacting with the DSCP (Digital Supply-Chain Platform)

## Environment Variables

`inteli-api` is configured primarily using environment variables as follows:

| variable          | required | default  | description                                                                          |
| :---------------- | :------: | :------: | :----------------------------------------------------------------------------------- |
| SERVICE_TYPE      |    N     |  `info`  | Logging level. Valid values are [`trace`, `debug`, `info`, `warn`, `error`, `fatal`] |
| PORT              |    N     |  `3001`  | The port for the API to listen on                                                    |
| LOG_LEVEL         |    N     |  `info`  | Logging level. Valid values are [`trace`, `debug`, `info`, `warn`, `error`, `fatal`] |
| API_VERSION       |    N     |    -     | API version                                                                          |
| API_MAJOR_VERSION |    N     |    -     | API major version                                                                    |
| DB_HOST           |    Y     |    -     | PostgreSQL database hostname                                                         |
| DB_PORT           |    N     |  `5432`  | PostgreSQL database port                                                             |
| DB_NAME           |    N     | `inteli` | PostgreSQL database name                                                             |
| DB_USERNAME       |    Y     |    -     | PostgreSQL database username                                                         |
| DB_PASSWORD       |    Y     |    -     | PostgreSQL database password                                                         |

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
