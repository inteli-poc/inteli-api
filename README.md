# inteli-api

### Inteli OpenAPI service for interacting with the DSCP (Digital Supply-Chain Platform). 

This project consists of an Express Node.js application that processes API requests from the front-end React Supply Chain application, for a private Inteli network.

## Environment Variables

`inteli-api` is configured primarily using environment variables as follows:

| variable          | required | default  | description                                                                          |
| :---------------- | :------: | :------: | :----------------------------------------------------------------------------------- |
| SERVICE_TYPE      |    N     |  `inteli-api`  | Name of the service |
| PORT              |    N     |    `80` | The port for the API to listen on                                                    |
| LOG_LEVEL         |    N     |  `info`  | Logging level. Valid values are [`trace`, `debug`, `info`, `warn`, `error`, `fatal`] |
| API_VERSION       |    N     |    -     | API version                                                                          |
| API_MAJOR_VERSION |    N     |    `v1`     | API major version                                                                    |
| DB_HOST           |    Y     |    -     | PostgreSQL database hostname                                                         |
| DB_PORT           |    N     |  `5432`  | PostgreSQL database port                                                             |
| DB_NAME           |    N     | `inteli` | PostgreSQL database name                                                             |
| DB_USERNAME       |    Y     |    -     | PostgreSQL database username                                                         |
| DB_PASSWORD       |    Y     |    -     | PostgreSQL database password                                                         |

## Getting started

Install node:

For Mac OS:
```
brew install node
```
For Ubuntu OS:
```
 sudo apt-get update
 sudo apt-get install nodejs
```
To start dependencies

```
docker-compose up -d
```

Run DB migrations

```
npm install knex
npx knex migrate:latest --env test
```

Run the application in development mode:

```sh
npm run dev
```
#### Note: To change the default environment variable values, create a .env folder at the root of this project and configure the environment variables given in the above table. To run the app:

```
npm install
node app/index.js
```

The documentation for this API can be found on Swagger UI at the following address:

```
http://localhost:${PORT}/${API_MAJOR_VERSION}/swagger

example: http://localhost:3000/v1/swagger
```

