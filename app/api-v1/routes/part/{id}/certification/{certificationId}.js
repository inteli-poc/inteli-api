// eslint-disable-next-line no-unused-vars
module.exports = function (partService) {
  const doc = {
    GET: async function (req, res) {
      res.status(500).json({ message: 'Not Implemented' })
    },
  }

  doc.GET.apiDoc = {
    summary: 'Get Part Certification Action',
    parameters: [
      {
        description: 'Id of the part',
        in: 'path',
        required: true,
        name: 'id',
        allowEmptyValue: false,
      },
    ],
    responses: {
      200: {
        description: 'Return Part Certification Action',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/PartCertification',
            },
          },
        },
      },
      404: {
        description: 'Part not found',
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
