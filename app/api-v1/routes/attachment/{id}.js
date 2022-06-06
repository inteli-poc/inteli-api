// eslint-disable-next-line no-unused-vars
const { BadRequestError, InternalError, NotAcceptableError } = require('../../../utils/errors')
const { parseAccept } = require('../../../utils/parseAcceptHeader')

module.exports = function (attachmentService) {
  const doc = {
    GET: async function (req, res) {
      const response = await attachmentService.getAttachmentByID(req.params.id)
      const filename = response.filename
      const orderedAccept = parseAccept(req.headers.accept)

      if (filename === 'json') {
        for (const mimeType of orderedAccept) {
          if (mimeType === 'application/json' || mimeType === 'application/*' || mimeType === '*/*') {
            try {
              const json = JSON.parse(response.binary_blob)
              res.status(200).json(json)
            } catch (error) {
              throw new InternalError({ message: error })
            }
            return
          }
          if (mimeType === 'application/octet-stream') {
            res.status(200)
            res.set({
              immutable: true,
              maxAge: 365 * 24 * 60 * 60 * 1000,
              'content-disposition': `attachment; filename="${response.filename}"`,
              'access-control-expose-headers': 'content-disposition',
              'content-type': 'application/octet-stream',
            })
            res.send(response.binary_blob)
            return
          }
        }
        throw new NotAcceptableError({ message: 'Client file request not supported' })
      } else {
        for (const mimeType of orderedAccept) {
          if (mimeType === 'application/octet-stream' || mimeType === 'application/*' || mimeType === '*/*') {
            res.status(200)
            res.set({
              immutable: true,
              maxAge: 365 * 24 * 60 * 60 * 1000,
              'content-disposition': `attachment; filename="${response.filename}"`,
              'access-control-expose-headers': 'content-disposition',
              'content-type': 'application/octet-stream',
            })
            res.send(response.binary_blob)
            return
          }
          throw new NotAcceptableError({ message: 'Client file request not supported' })
        }
      }
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
    security: [{ bearerAuth: [] }],
    tags: ['attachment'],
  }

  return doc
}
