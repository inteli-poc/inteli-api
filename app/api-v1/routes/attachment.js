const { getDefaultSecurity } = require('../../utils/auth')
const attachment = require('../controllers/Attachment')
const { buildValidatedJsonHandler } = require('../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(attachment.get, {
      summary: 'List attachments',
      description: 'Returns the file metadata (e.g. filename, size) of all uploaded attachments.',
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
      description: `Uploads a file to later use in a request (such as the image of a recipe). Content can either be a file (multipart/form-data) or JSON (application/json). Attachments are not viewable to other members`,
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
