const { getDefaultSecurity } = require('../../utils/auth')
const attachment = require('../controllers/Attachment')
const { buildValidatedJsonHandler } = require('../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(attachment.get, {
      summary: 'List attachments',
      parameters: [],
      responses: {
        200: {
          description: 'Return attachment list',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/AttachmentEntry',
                },
              },
            },
          },
        },
      },
      security: getDefaultSecurity(),
      tags: ['attachment'],
    }),
    POST: buildValidatedJsonHandler(attachment.create, {
      summary: 'Create Attachment',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                },
              },
            },
          },
          'application/json': {
            schema: {
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
      responses: {
        201: {
          description: 'Attachment Created',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AttachmentEntry',
              },
            },
          },
        },
        400: {
          description: 'Invalid request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BadRequestError',
              },
            },
          },
        },
      },
      security: getDefaultSecurity(),
      tags: ['attachment'],
    }),
  }

  return doc
}
