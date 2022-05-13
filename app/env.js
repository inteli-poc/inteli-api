const envalid = require('envalid')
const dotenv = require('dotenv')
const { version } = require('../package.json')

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: 'test/test.env' })
} else {
  dotenv.config({ path: '.env' })
}

const vars = envalid.cleanEnv(
  process.env,
  {
    SERVICE_TYPE: envalid.str({ default: 'inteli-api'.toUpperCase().replace(/-/g, '_') }),
    PORT: envalid.port({ default: 80, devDefault: 3000 }),
    API_VERSION: envalid.str({ default: version }),
    API_MAJOR_VERSION: envalid.str({ default: 'v1' }),
    DSCP_API_HOST: envalid.host({ devDefault: 'localhost' }),
    DSCP_API_PORT: envalid.port({ devDefault: 3001 }),
    LOG_LEVEL: envalid.str({ default: 'info', devDefault: 'debug' }),
    DB_HOST: envalid.host({ devDefault: 'localhost' }),
    DB_PORT: envalid.port({ default: 5432 }),
    DB_NAME: envalid.str({ default: 'inteli' }),
    DB_USERNAME: envalid.str({ devDefault: 'postgres' }),
    DB_PASSWORD: envalid.str({ devDefault: 'postgres' }),
    FILE_UPLOAD_SIZE_LIMIT_BYTES: envalid.num({ default: 1024 * 1024 * 100, devDefault: 1024 * 1024 * 10 }),
    AUTH_JWKS_URI: envalid.url({ devDefault: 'https://inteli.eu.auth0.com/.well-known/jwks.json' }),
    AUTH_AUDIENCE: envalid.str({ devDefault: 'inteli-dev' }),
    AUTH_ISSUER: envalid.url({ devDefault: 'https://inteli.eu.auth0.com/' }),
    AUTH_TOKEN_URL: envalid.url({ devDefault: 'https://inteli.eu.auth0.com/oauth/token' }),
    IDENTITY_SERVICE_HOST: envalid.host({ devDefault: 'localhost' }),
    IDENTITY_SERVICE_PORT: envalid.port({ devDefault: 3002 }),
  },
  {
    strict: true,
  }
)

module.exports = vars
