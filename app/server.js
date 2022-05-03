const express = require('express')
const cors = require('cors')
const pinoHttp = require('pino-http')
const { initialize } = require('express-openapi')
const swaggerUi = require('swagger-ui-express')
const path = require('path')
const bodyParser = require('body-parser')
const compression = require('compression')
const { PORT, API_VERSION, API_MAJOR_VERSION } = require('./env')
const logger = require('./logger')
const v1ApiDoc = require('./api-v1/api-doc')
const v1RecipeService = require('./api-v1/services/recipeService')
const v1AttachmentService = require('./api-v1/services/attachmentService')
const v1BuildService = require('./api-v1/services/buildService')
const v1OrderService = require('./api-v1/services/orderService')
const v1PartService = require('./api-v1/services/partService')

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

  initialize({
    app,
    apiDoc: v1ApiDoc,
    securityHandlers: {},
    dependencies: {
      recipeService: v1RecipeService,
      attachmentService: v1AttachmentService,
      buildService: v1BuildService,
      partService: v1PartService,
      orderService: v1OrderService,
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

  // Sorry - app.use checks arity
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.errors) {
      // openapi validation
      res.status(err.status).send(err.errors)
    } else if (err.status) {
      res.status(err.status).send({ error: err.status === 401 ? 'Unauthorised' : err.message })
    } else {
      logger.error('Fallback Error %j', err.stack)
      res.status(500).send('Fatal error!')
    }
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

module.exports = { startServer, createHttpServer }
