const { getDefaultSecurity } = require('../../../utils/auth')
const attachmentController = require('../../controllers/Attachment')

module.exports = function () {
  const doc = {
    GET: async (req, res) => {
      const { status, response, headers } = await attachmentController.get(req)
      if (headers) res.set(headers)
      res.status(status).send(response)
    },
  }

  doc.GET.apiDoc = {
    summary: 'GET attachment by id',
    parameters: [
      {
        description: 'Id of the attachment to get',
        in: 'path',
        required: true,
        name: 'id',
        allowEmptyValue: false,
        schema: {
          $ref: '#/components/schemas/ObjectReference',
        },
      },
    ],
    responses: {
      200: {
        description: 'Return attachment',
        content: {
          'application/octet-stream': {
            schema: {
              description: 'Attachment file',
              type: 'string',
              format: 'binary',
            },
          },
          'application/json': {
            schema: {
              description: 'Attachment json',
              anyOf: [
                {
                  type: 'object',
                  properties: {},
                  additionalProperties: true,
                },
                {
                  type: 'array',
                  items: {},
                },
              ],
            },
            example: {},
          },
        },
      },
    },
    security: getDefaultSecurity(),
    tags: ['attachment'],
  }

  return doc
}
