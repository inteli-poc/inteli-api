// eslint-disable-next-line no-unused-vars
module.exports = function (buildService) {
  const doc = {
    GET: async function (req, res) {
      res.status(500).json({ message: 'Not Implemented' })
    },
  }

  doc.GET.apiDoc = {
    summary: 'Get Build Schedule Action',
    parameters: [
      {
        description: 'Id of the build',
        in: 'path',
        required: true,
        name: 'id',
        allowEmptyValue: false,
        schema: {
          $ref: '#/components/schemas/ObjectReference',
        },
      },
      {
        description: 'Id of the build schedule action',
        in: 'path',
        required: true,
        name: 'scheduleId',
        allowEmptyValue: false,
        schema: {
          $ref: '#/components/schemas/ObjectReference',
        },
      },
    ],
    responses: {
      200: {
        description: 'Return Build Schedule Action',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/BuildSchedule',
            },
          },
        },
      },
      404: {
        description: 'Build not found',
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
    security: [{ bearerAuth: [] }],
    tags: ['build'],
  }

  return doc
}
