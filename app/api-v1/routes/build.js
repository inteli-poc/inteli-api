const { getDefaultSecurity } = require('../../utils/auth')
const buildController = require('../controllers/Build')
const { buildValidatedJsonHandler } = require('../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(buildController.getAll, {
      summary: 'List Builds',
      description: 'Returns all builds.',
      parameters: [],
      responses: {
        200: {
          description: 'Return Builds',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Build',
                },
              },
            },
          },
        },
      },
      security: getDefaultSecurity(),
      tags: ['build'],
    }),
    POST: buildValidatedJsonHandler(buildController.create, {
      summary: 'Create Build',
      description:
        'A Supplier creates a new build containing a list of recipes that will generate parts. One part is created per recipe. Multiple parts can be built by listing the same recipe ID multiple times. The Supplier must be the `supplier` on each recipe. The build is not yet viewable to other members.',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/NewBuild',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Build Created',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Build',
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
      tags: ['build'],
    }),
  }

  return doc
}
