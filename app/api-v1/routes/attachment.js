const logger = require('../../logger')
const { BadRequestError } = require('../../utils/errors')

module.exports = function (attachmentService) {
  const doc = {
    GET: async function (req, res) {
      res.status(500).json({ message: 'Not Implemented' })
    },
    POST: async function (req, res) {
      if (req.headers['content-type'] === 'application/json') {
        logger.info('JSON attachment upload: %j', req.body)
        const buffer = Buffer.from(JSON.stringify(req.body))
        const [result] = await attachmentService.createAttachment('json', buffer)
        res.status(201).json({ ...result, size: buffer.length })
        return
      }

      logger.info('File attachment upload: %s', req.file)

      if (!req.file) {
        throw new BadRequestError({ message: 'No file uploaded', service: 'attachment' })
      }

      const [result] = await attachmentService.createAttachmentFromFile(req.file)
      res.status(201).json({ ...result, size: req.file.size })
    },
  }

  doc.GET.apiDoc = {
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
      default: {
        description: 'An error occurred',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/responses/Error',
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: ['attachment'],
  }

  doc.POST.apiDoc = {
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
              $ref: '#/components/responses/BadRequestError',
            },
          },
        },
      },
      default: {
        description: 'An error occurred',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/responses/Error',
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: ['attachment'],
  }

  return doc
}
