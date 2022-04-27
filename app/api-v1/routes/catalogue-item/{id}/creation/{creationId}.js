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
    summary: 'Get Catalogue Item Creation Action',
    parameters: [
      {
        description: 'Id of the catalogue-item',
        in: 'path',
        required: true,
        name: 'id',
        allowEmptyValue: false,
      },
      {
        description: 'Id of the catalogue-item creation action',
        in: 'path',
        required: true,
        name: 'creationId',
        allowEmptyValue: false,
      },
    ],
    responses: {
      200: {
        description: 'Return Catalogue Item Creation Action',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CatalogueItemCreation',
            },
          },
        },
      },
      404: {
        description: 'Catalogue Item Creation Action not found',
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

  return doc
}
