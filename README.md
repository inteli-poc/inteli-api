# inteli-api

Inteli OpenAPI service for interacting with the DSCP (Digital Supply-Chain Platform)

## Environment Variables

`inteli-api` is configured primarily using environment variables as follows:

| variable          | required | default | description                                                                          |
| :---------------- | :------: | :-----: | :----------------------------------------------------------------------------------- |
| SERVICE_TYPE      |    N     | `info`  | Logging level. Valid values are [`trace`, `debug`, `info`, `warn`, `error`, `fatal`] |
| PORT              |    N     | `3001`  | The port for the API to listen on                                                    |
| LOG_LEVEL         |    N     | `info`  | Logging level. Valid values are [`trace`, `debug`, `info`, `warn`, `error`, `fatal`] |
| API_VERSION       |    N     |    -    | API version                                                                          |
| API_MAJOR_VERSION |    N     |    -    | API major version                                                                    |
