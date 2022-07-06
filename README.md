# inteli-api

Inteli OpenAPI service for interacting with the DSCP (Digital Supply-Chain Platform)

## Environment Variables

`inteli-api` is configured primarily using environment variables as follows:

| variable                     | required |        default         | description                                                                          |
| :--------------------------- | :------: | :--------------------: | :----------------------------------------------------------------------------------- |
| SERVICE_TYPE                 |    N     |         `info`         | Logging level. Valid values are [`trace`, `debug`, `info`, `warn`, `error`, `fatal`] |
| PORT                         |    N     |          `80`          | The port for the API to listen on                                                    |
| LOG_LEVEL                    |    N     |         `info`         | Logging level. Valid values are [`trace`, `debug`, `info`, `warn`, `error`, `fatal`] |
| API_VERSION                  |    N     | `package.json version` | API version                                                                          |
| API_MAJOR_VERSION            |    N     |          `v1`          | API major version                                                                    |
| DSCP_API_HOST                |    Y     |           -            | `dscp-api` host                                                                      |
| DSCP_API_PORT                |    Y     |           -            | `dscp-api` port                                                                      |
| DB_HOST                      |    Y     |           -            | PostgreSQL database hostname                                                         |
| DB_PORT                      |    N     |         `5432`         | PostgreSQL database port                                                             |
| DB_NAME                      |    N     |        `inteli`        | PostgreSQL database name                                                             |
| DB_USERNAME                  |    Y     |           -            | PostgreSQL database username                                                         |
| DB_PASSWORD                  |    Y     |           -            | PostgreSQL database password                                                         |
| FILE_UPLOAD_SIZE_LIMIT_BYTES |    N     |  `1024 * 1024 * 100`   | Maximum file size in bytes for upload                                                |
| IDENTITY_SERVICE_HOST        |    Y     |                        | Hostname of the `dscp-identity-service`                                              |
| IDENTITY_SERVICE_PORT        |    Y     |                        | Port of the `dscp-identity-service`                                                  |
| AUTH_TYPE                    |    N     |         `NONE`         | Authentication type for routes on the service. Valid values: [`NONE`, `JWT`]         |

The following environment variables are additionally used when `AUTH_TYPE : 'JWT'`

| variable       | required |                       default                       | description                                                           |
| :------------- | :------: | :-------------------------------------------------: | :-------------------------------------------------------------------- |
| AUTH_JWKS_URI  |    N     | `https://inteli.eu.auth0.com/.well-known/jwks.json` | JSON Web Key Set containing public keys used by the Auth0 API         |
| AUTH_AUDIENCE  |    N     |                    `inteli-dev`                     | Identifier of the Auth0 API                                           |
| AUTH_ISSUER    |    N     |           `https://inteli.eu.auth0.com/`            | Domain of the Auth0 API `                                             |
| AUTH_TOKEN_URL |    N     |      `https://inteli.eu.auth0.com/oauth/token`      | Auth0 API endpoint that issues an Authorisation (Bearer) access token |

## Getting started

Start dependencies:

```
docker compose up -d
```

Install packages:

```
npm i
```

Run DB migrations:

```
npx knex migrate:latest --env test
```

Run the application in development mode:

```sh
npm run dev
```

Assuming `devDefault` environment variables, view OpenAPI documentation for all routes with Swagger:

```
localhost:3000/v1/swagger/
```

The Swagger route is constructed as `localhost:{PORT}/{API_MAJOR_VERSION}/swagger`. OpenAPI docs can also be viewed as JSON `localhost:{PORT}/{API_MAJOR_VERSION}/api-docs`.

## Authentication

If `AUTH_TYPE` env is set to `JWT`, the endpoints on `inteli-api` require Bearer Authentication using a JSON Web Token. Tokens are generated externally as an Auth0 Machine to Machine token. You will need to create your own Auth0 API, which can be done for free, and set the appropriate [environment variables](#configuration) (those prefixed with `AUTH`). Follow the start of this [tutorial](https://auth0.com/docs/quickstart/backend/nodejs#configure-auth0-apis) to create an API. Go [here](app/routes/auth.js) and [here](app/auth.js) to see where the environment variables are used.

## Testing

Integration tests for `AUTH_TYPE: 'JWT'` use a preconfigured Auth0 test application and user to authenticate across multiple `dscp` services. Follow the tutorial [here](https://auth0.com/docs/get-started/authentication-and-authorization-flow/call-your-api-using-resource-owner-password-flow) to create your own.

Once a test application and user is created, running integration tests locally requires a `/test/test.env` file containing the following environment variables:

| variable                | required | default | description                                        |
| :---------------------- | :------: | :-----: | :------------------------------------------------- |
| AUTH_TEST_USERNAME      |    Y     |    -    | Username of the auth0 user for testing             |
| AUTH_TEST_PASSWORD      |    Y     |    -    | Password of the auth0 user for testing             |
| AUTH_TEST_CLIENT_ID     |    Y     |    -    | Client ID of the auth0 application for testing     |
| AUTH_TEST_CLIENT_SECRET |    Y     |    -    | Client secret of the auth0 application for testing |

Start dependencies with `AUTH_TYPE: 'JWT'`:

```
AUTH_TYPE=JWT docker compose up -d
```

Run tests:

```
npm run test:jwt
```

## API design

`inteli-api` provides a RESTful OpenAPI-based interface for third parties and front-ends to interact with the `DSCP` system. The design prioritises:

1. RESTful design principles:
   - all endpoints describing discrete operations on path derived entities.
   - use of HTTP verbs to describe whether state is modified, whether the action is idempotent etc.
   - HTTP response codes indicating the correct status of the request.
   - HTTP response bodies including the details of a query response or details about the entity being created/modified.
2. Simplicity of structure. The API should be easily understood by a third party and traversable.
3. Simplicity of usage:
   - all APIs that take request bodies taking a JSON structured request with the exception of attachment upload (which is idiomatically represented as a multipart form).
   - all APIs which return a body returning a JSON structured response (again with the exception of attachments.
4. Abstraction of the underlying DLT components. This means no token Ids, no block numbers etc.
5. Conflict free identifiers. All identifiers must be conflict free as updates can come from third party organisations.

### Fundamental entities

These are the top level physical concepts in the system. They are the top level RESTful path segments. Note that different states of an entity will **NOT** be represented as different top level entities.

- `recipe`
- `orders`
- `build`
- `part`

Additionally, there is one more top level entity `attachment` which accepts a `multipart/form-data` payload for uploading a file. This returns an `attachmentId` that can then be used when preparing entity updates to attach files.

### Entity queries

Entity queries allow the API user to list those entities (including a query) and to get a specific entity. For `order` for example:

- `GET /order` - list orders
- `GET /order/{orderId}` - get order

### Entity creation

Allows the creation of an initial local state for an entity. Note this is essentially just to establish an internal identifier for the entity and **the state is not shared across the blockchain network at this point**.

- `POST /order`

### Entity updates

Allows different kind of updates to be prepared and applied to an entity. For example, an `order` must be submitted via a `submission` action. Each update can have specific files attached along with other specific metadata.

- `POST /order/{orderId}/submission` - create an order `submission` action and send it to the blockchain.
- `GET /order/{orderId}/submission` - list order `submissions` and their status.
- `GET /order/{orderId}/submission/{submissionId}` - get the details of an order `submission`.

### Attachment API

The last top level entity `attachment`, which accepts a `multipart/form-data` payload for uploading a file or `application/json` for uploading JSON as a file. This will return an `attachmentId` that can then be used when preparing entity updates to attach files.

- `POST /attachment`
- `GET /attachment/{attachmentId}`

## Demo scenario

Demoing the routes in `inteli-api` requires two personas: `buyer` and `supplier`. Each persona runs their own instance of `inteli-api` and its dependencies.

Before transacting, each persona sets aliases in `dscp-identity-service` for other parties' node addresses so they can refer to them by human-friendly names. The `self` alias should also be set for a persona's own node address.

1. `buyer` wants to create a `recipe`, which describes how a particular `supplier` will make a `part`. A `recipe` always includes an image `attachment`, so first `buyer` must upload an image to their local database with `POST /attachment`.
2. They use the returned `imageattachmentId` in the request body to `POST /recipe`, as well as setting `supplier: 'supplier'` and providing an array of `requiredCerts` for the `recipe`. Later on, `supplier` will need to add a certificate file for each `requiredCert` for the `part` built from the `recipe`. At this point, the `recipe` only exists in the `buyer` database.
3. When `buyer` is ready for the `recipe` to exist on chain they `POST recipe/{id}/creation`. `supplier` can now see the `recipe` if their node is running and connected.
4. `buyer` creates an `order` of 1-10 `recipes` in their local database with `POST /order`, again setting `supplier: 'supplier'`. The request will fail if any of the listed recipes are set with a different supplier.
5. When `buyer` is ready for the `order` to exist on chain they `POST order/{id}/submission`.
6. `supplier` can `POST order/{id}/rejection` or `POST order/{id}/acceptance` the order. For simplicity they will accept, signifying their intent to build `parts` to fulfil the `order`.
7. `supplier` creates a `build` of 1-10 `recipes` in their local database. They must have the `supplier` role for each `recipe`.
8. When `supplier` is ready for the `build` to exist on chain they `POST build/{id}/schedule`. This also creates a new `part` on chain for each `recipe`.
9. `supplier` can assign an individual `part` to an `order` with `POST part/{id}/order-assignment`. `itemIndex` in the request body matches the index on the `order` for the specific `recipe` that was used to build that `part`. `builds` (and `parts`) can be started and completed before an `order` is made and later assigned to one.
10. A required certificate (`attachment`) for a `part` is added with `/part/{id}/certification` by `supplier`. `certificationIndex` in the request matches the index on the `recipe` for the `requiredCert` that the uploaded certificate is fulfilling.
11. `supplier` can change the estimated date of completion or add general build files (`attachments`) to the `build` with `POST build/{id}/progress-update`.
12. `supplier` can add general, non-required files (`attachments`) to the `part` with `POST build/{id}/metadata-update`.
13. Finally, `supplier` can complete the `build` with `POST build/{id}/completion`.
