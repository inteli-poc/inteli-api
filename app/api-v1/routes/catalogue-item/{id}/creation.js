// eslint-disable-next-line no-unused-vars
module.exports = function (catalogueService) {
  const doc = {
    GET: async function (req, res) {
      res.status(500).json({ message: 'Not Implemented' })
    },
    POST: async function (req, res) {
      res.status(500).json({ message: 'Not Implemented' })
    },
  }

  doc.GET.apiDoc = {
    summary: 'List Catalogue Item Creation Actions',
    parameters: [
      {
        description: 'Id of the catalogue-item',
        in: 'path',
        required: true,
        name: 'id',
        allowEmptyValue: false,
      },
    ],
    responses: {
      200: {
        description: 'Return Catalogue Item Creation Actions',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CatalogueItemCreation',
              },
            },
          },
        },
      },
      404: {
        description: 'Catalogue Item not found',
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
    tags: ['catalogue-item'],
  }

  doc.POST.apiDoc = {
    summary: 'Create Catalogue Item Creation Action',
    parameters: [
      {
        description: 'Id of the catalogue-item',
        in: 'path',
        required: true,
        name: 'id',
        allowEmptyValue: false,
      },
    ],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/NewCatalogueItemCreation',
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Catalogue Item Creation Created',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CatalogueItemCreation',
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
    tags: ['catalogue-item'],
  }

  return doc
}
