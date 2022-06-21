const OpenAPIResponseValidatorModule = require('openapi-response-validator')
const commonApiDoc = require('../api-v1/api-doc')
const logger = require('./Logger')

const commonResponses = {
  401: {
    description: 'An unauthorized error occurred',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/UnauthorizedError',
        },
      },
    },
  },
  default: {
    description: 'An error occurred',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/Error',
        },
      },
    },
  },
}

const buildValidatedJsonHandler = (controller, apiDoc) => {
  const OpenAPIResponseValidator = OpenAPIResponseValidatorModule.default
  const responses = {
    ...commonResponses,
    ...apiDoc.responses,
  }
  const responseValidator = new OpenAPIResponseValidator({
    responses,
    components: commonApiDoc.components,
  })

  const handler = async function (req, res) {
    const { status, response, headers } = await controller(req)
    res.set(headers ? headers : { 'content-type': 'application/json' })
    const validationErrors = responseValidator.validateResponse(status, response)

    if (validationErrors) {
      logger.warn('API response validation error for handler "%s". Errors were: %j', apiDoc.summary, validationErrors)
      return res.status(500).send({ message: 'Internal server error' })
    }

    res.status(status).send(response)
  }
  handler.apiDoc = {
    ...apiDoc,
    responses,
  }
  return handler
}

module.exports = {
  commonResponses,
  buildValidatedJsonHandler,
}
