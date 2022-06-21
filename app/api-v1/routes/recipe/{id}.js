const { getDefaultSecurity } = require('../../../utils/auth')
const { buildValidatedJsonHandler } = require('../../../utils/routeResponseValidator')

const controller = require('../../controllers/Recipe')

// eslint-disable-next-line no-unused-vars
module.exports = function (recipeService, identityService) {
  const doc = {
    GET: buildValidatedJsonHandler(controller.getById, {
      summary: 'Get Recipe by ID',
      parameters: [
        {
          description: 'Id of the recipe to get',
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
                $ref: '#/components/schemas/NotFoundError',
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
