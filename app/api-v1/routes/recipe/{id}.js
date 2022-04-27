// eslint-disable-next-line no-unused-vars
module.exports = function (recipeService) {
  const doc = {
    GET: async function (req, res) {
      res.status(500).json({ message: 'Not Implemented' })
    },
  }

  doc.GET.apiDoc = {
    summary: 'Get Recipe',
    parameters: [
      {
        description: 'Id of the recipe to get',
        in: 'path',
        required: true,
        name: 'id',
        allowEmptyValue: false,
      },
    ],
    responses: {
      200: {
        description: 'Return Recipe',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Recipe',
            },
          },
        },
      },
      404: {
        description: 'Recipe not found',
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
    tags: ['recipe'],
  }

  return doc
}
