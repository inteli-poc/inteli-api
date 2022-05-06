// eslint-disable-next-line no-unused-vars
module.exports = function (attachmentService) {
  const doc = {
    GET: async function (req, res) {
      res.status(500).json({ message: 'Not Implemented' })
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
