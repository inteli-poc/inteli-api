const { getDefaultSecurity } = require('../../../utils/auth')
const recipe = require('../../controllers/Recipe')
const { buildValidatedJsonHandler } = require('../../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(recipe.getCount, {
      summary: 'Returns recipe Count',
      description: 'Returns the total number of recipes.',
      parameters: [],
      responses: {
        200: {
          description: 'Return recipe Count',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/recipeCount',
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
