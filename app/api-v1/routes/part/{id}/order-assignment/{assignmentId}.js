// eslint-disable-next-line no-unused-vars
module.exports = function (partService) {
  const doc = {
    GET: async function (req, res) {
      res.status(500).json({ message: 'Not Implemented' })
    },
  }

  doc.GET.apiDoc = {
    summary: 'Get Part Order Assignment Action',
    parameters: [
      {
        description: 'Id of the part',
        in: 'path',
        required: true,
        name: 'id',
        allowEmptyValue: false,
      },
      {
        description: 'Id of the part order assignment action',
        in: 'path',
        required: true,
        name: 'assignmentId',
        allowEmptyValue: false,
      },
    ],
    responses: {
      200: {
        description: 'Return Part Order Assignment Action',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/PartOrderAssignment',
            },
          },
        },
      },
      404: {
        description: 'Part Order Assignment not found',
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
    tags: ['part'],
  }

  return doc
}
