// eslint-disable-next-line no-unused-vars
module.exports = function (buildService) {
  const doc = {
    GET: async function (req, res) {
      res.status(500).json({ message: 'Not Implemented' })
    },
  }

  doc.GET.apiDoc = {
    summary: 'Get Build Completion Action',
    parameters: [
      {
        description: 'Id of the build',
        in: 'path',
        required: true,
        name: 'id',
        allowEmptyValue: false,
      },
      {
        description: 'Id of the build completion action',
        in: 'path',
        required: true,
        name: 'completionId',
        allowEmptyValue: false,
      },
    ],
    responses: {
      200: {
        description: 'Return Build Completion Action',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/BuildCompletion',
            },
          },
        },
      },
      404: {
        description: 'Build Completion Action not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/responses/NotFoundError',
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
    tags: ['build'],
  }

  return doc
}
