const OpenAPIResponseValidatorModule = require('openapi-response-validator')
const commonApiDoc = require('../api-v1/api-doc')
const logger = require('./Logger')

const buildValidatedJsonHandler = (controller, apiDoc) => {
  const OpenAPIResponseValidator = OpenAPIResponseValidatorModule.default
  const responseValidator = new OpenAPIResponseValidator({
    responses: apiDoc.responses,
    components: commonApiDoc.components,
  })
  const handler = async function (req, res) {
    const { status, response } = await controller(req)
    const validationErrors = responseValidator.validateResponse(status, response)
    if (validationErrors) {
      logger.warn('API response validation error for handler "%s". Errors were: %j', apiDoc.summary, validationErrors)
      res.status(500).json({ message: 'Internal server error' })
    } else {
      res.status(status).json(response)
    }
  }
  handler.apiDoc = apiDoc
  return handler
}

module.exports = {
  buildValidatedJsonHandler,
}
