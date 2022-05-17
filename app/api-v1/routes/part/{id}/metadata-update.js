// eslint-disable-next-line no-unused-vars
module.exports = function (partService) {
  const doc = {
    GET: async function (req, res) {
      res.status(500).json({ message: 'Not Implemented' })
    },
    POST: async function (req, res) {
      res.status(500).json({ message: 'Not Implemented' })
    },
  }

  doc.GET.apiDoc = {
    summary: 'List Part Metadata Update Actions',
    parameters: [
      {
        description: 'Id of the part',
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
        description: 'Return Part Metadata Update Actions',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/PartMetadataUpdate',
              },
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
    security: [{ bearerAuth: [] }],
    tags: ['part'],
  }

  doc.POST.apiDoc = {
    summary: 'Create Part Metadata Update Action',
    parameters: [
      {
        description: 'Id of the part',
        in: 'path',
        required: true,
        name: 'id',
        allowEmptyValue: false,
        schema: {
          $ref: '#/components/schemas/ObjectReference',
        },
      },
    ],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/NewPartMetadataUpdate',
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Part Metadata Updated Action Created',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/PartMetadataUpdate',
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
    tags: ['part'],
  }

  return doc
}
