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
const { PORT, API_VERSION, API_MAJOR_VERSION, FILE_UPLOAD_SIZE_LIMIT_BYTES, AUTH_TYPE } = require('./env')
const logger = require('./utils/Logger')
const v1ApiDoc = require('./api-v1/api-doc')
const v1RecipeService = require('./api-v1/services/recipeService')
const v1AttachmentService = require('./api-v1/services/attachmentService')
const v1BuildService = require('./api-v1/services/buildService')
const v1DscpApiService = require('./api-v1/services/dscpApiService')
const v1OrderService = require('./api-v1/services/orderService')
const v1PartService = require('./api-v1/services/partService')
const v1IdentityService = require('./api-v1/services/identityService')
const { handleErrors } = require('./utils/errors')
const { verifyJwks } = require('./utils/auth')

async function createHttpServer() {
  const app = express()
  const requestLogger = pinoHttp({ logger })

  app.use(cors())
  app.use(compression())
  app.use(bodyParser.json())

  app.use((req, res, next) => {
    if (req.path !== '/health') requestLogger(req, res)
    next()
  })

  app.get('/health', async (req, res) => {
    res.status(200).send({ version: API_VERSION, status: 'ok' })
    return
  })

  const multerOptions = {
    limits: { fileSize: FILE_UPLOAD_SIZE_LIMIT_BYTES },
    storage: multer.diskStorage({}),
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
      recipeService: v1RecipeService,
      attachmentService: v1AttachmentService,
      buildService: v1BuildService,
      dscpApiService: v1DscpApiService,
      partService: v1PartService,
      orderService: v1OrderService,
      identityService: v1IdentityService,
    },
    paths: [path.resolve(__dirname, `api-${API_MAJOR_VERSION}/routes`)],
  })

  const options = {
    swaggerOptions: {
      urls: [
        {
          url: `http://localhost:${PORT}/${API_MAJOR_VERSION}/api-docs`,
          name: 'Inteli API Service',
        },
      ],
    },
  }

  app.use(`/${API_MAJOR_VERSION}/swagger`, swaggerUi.serve, swaggerUi.setup(null, options))
  app.use(handleErrors)

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
