// eslint-disable-next-line no-unused-vars
module.exports = function (catalogueService) {
  const doc = {
    GET: async function (req, res) {
      res.status(500).json({ message: 'Not Implemented' })
    },
  }

  doc.GET.apiDoc = {
    summary: 'Get Catalogue Item',
    parameters: [
      {
        description: 'Id of the catalogue-item to get',
        in: 'path',
        required: true,
        name: 'id',
        allowEmptyValue: false,
      },
    ],
    responses: {
      200: {
        description: 'Return Catalogue Item',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CatalogueItem',
            },
          },
        },
      },
      404: {
        description: 'Catalogue-item not found',
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
