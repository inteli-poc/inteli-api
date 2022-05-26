const { transaction } = require('../../../controllers/Recipe')
const { buildValidatedJsonHandler } = require('../../../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(transaction.getAll, {
      summary: 'List Recipe Creation Actions',
      parameters: [
        {
          description: 'Id of the recipe',
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
          description: 'Return Recipe Creation Actions',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/RecipeCreation',
                },
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
    }),
    POST: async function (req, res) {
      const { status, ...body } = await transaction.create(req)
      res.status(status).send(body)
    },
  }

  doc.POST.apiDoc = {
    summary: 'Create Recipe Creation Action',
    parameters: [
      {
        description: 'Id of the recipe',
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
            $ref: '#/components/schemas/NewRecipeCreation',
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Recipe Creation Created',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RecipeCreation',
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
    tags: ['recipe'],
  }

  return doc
}
