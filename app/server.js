const express = require('express')
require('express-async-errors')
const cors = require('cors')
const pinoHttp = require('pino-http')
const { initialize } = require('express-openapi')
const swaggerUi = require('swagger-ui-express')
const multer = require('multer')
const path = require('path')
const bodyParser = require('body-parser')
const compression = require('compression')
const { PORT, API_VERSION, API_MAJOR_VERSION, AUTH_TYPE, EXTERNAL_PATH_PREFIX } = require('./env')
const logger = require('./utils/Logger')
const v1ApiDoc = require('./api-v1/api-doc')
const v1DscpApiService = require('./api-v1/services/dscpApiService')
const v1IdentityService = require('./api-v1/services/identityService')
const { handleErrors } = require('./utils/errors')
const { verifyJwks } = require('./utils/auth')
const crypto = require('crypto')
const fs = require('fs').promises

async function createHttpServer() {
  const app = express()
  const requestLogger = pinoHttp({ logger })

  app.use(cors())
  app.use(compression())
  app.use(bodyParser.json())

  app.use((req, res, next) => {
    req.setTimeout(0)
    next()
  })

  app.use((req, res, next) => {
    if (req.path !== '/health') requestLogger(req, res)
    next()
  })

  app.get('/health', async (req, res) => {
    res.status(200).send({ version: API_VERSION, status: 'ok' })
  })

  app.get('/v1/health', async (req, res) => {
    res.status(200).send('ok')
  })

  const multerOptions = {
    limits: { fileSize: 8000000 },
    storage: multer.diskStorage({
      filename: (req, file, cb) => {
        const buf = crypto.randomBytes(20)
        cb(null, buf.toString('hex'))
      },
      destination: async (req, file, cb) => {
        const path = './uploads'
        await fs.mkdir(path, { recursive: true })
        cb(null, './uploads/')
      },
    }),
  }

  const securityHandlers =
    AUTH_TYPE === 'JWT'
      ? {
          bearerAuth: (req) => verifyJwks(req),
        }
      : {}

  initialize({
    app,
    apiDoc: v1ApiDoc,
    consumesMiddleware: {
      'multipart/form-data': function (req, res, next) {
        multer(multerOptions).single('file')(req, res, function (err) {
          if (err) return next(err)
          next()
        })
      },
    },
    securityHandlers: securityHandlers,
    dependencies: {
      dscpApiService: v1DscpApiService,
      identityService: v1IdentityService,
    },
    paths: [path.resolve(__dirname, `api-${API_MAJOR_VERSION}/routes`)],
  })

  const options = {
    swaggerOptions: {
      urls: [
        {
          url: `${v1ApiDoc.servers[0].url}/api-docs`,
          name: 'Inteli API Service',
        },
      ],
    },
  }

  app.use(
    EXTERNAL_PATH_PREFIX ? `/${EXTERNAL_PATH_PREFIX}/${API_MAJOR_VERSION}/swagger` : `/${API_MAJOR_VERSION}/swagger`,
    swaggerUi.serve,
    swaggerUi.setup(null, options)
  )
  app.use(handleErrors)

  logger.trace('Registered Express routes: %s', {
    toString: () => {
      return JSON.stringify(app._router.stack.map(({ route }) => route && route.path).filter((p) => !!p))
    },
  })

  return { app }
}

/* istanbul ignore next */
async function startServer() {
  try {
    const { app } = await createHttpServer()

    const setupGracefulExit = ({ sigName, server, exitCode }) => {
      process.on(sigName, async () => {
        server.close(() => {
          process.exit(exitCode)
        })
      })
    }

    const server = await new Promise((resolve, reject) => {
      let resolved = false
      const server = app.listen(PORT, (err) => {
        if (err) {
          if (!resolved) {
            resolved = true
            reject(err)
          }
        }
        logger.info(`Listening on port ${PORT} `)
        if (!resolved) {
          resolved = true
          resolve(server)
        }
      })
      server.on('error', (err) => {
        if (!resolved) {
          resolved = true
          reject(err)
        }
      })
    })

    setupGracefulExit({ sigName: 'SIGINT', server, exitCode: 0 })
    setupGracefulExit({ sigName: 'SIGTERM', server, exitCode: 143 })
  } catch (err) {
    logger.fatal('Fatal error during initialisation: %s, %j', err?.message, err)
    process.exit(1)
  }
}

module.exports = {
  startServer,
  createHttpServer,
}
