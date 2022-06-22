const { buildValidatedJsonHandler } = require('../../utils/routeResponseValidator')
const recipe = require('../controllers/Recipe')
const { getDefaultSecurity } = require('../../utils/auth')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(recipe.get, {
      summary: 'List Recipes',
      description: 'Returns all recipes.',
      parameters: [],
      responses: {
        200: {
          description: 'Return Recipes',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Recipe',
                },
              },
            },
          },
        },
      },
      security: getDefaultSecurity(),
      tags: ['recipe'],
    }),
    POST: buildValidatedJsonHandler(recipe.create, {
      summary: 'Create Recipe',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/NewRecipe',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Recipe Created',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Recipe',
              },
            },
          },
        },
        400: {
          description: 'Invalid request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BadRequestError',
              },
            },
          },
        },
      },
      security: getDefaultSecurity(),
      tags: ['recipe'],
    }),
  }

  return doc
}
