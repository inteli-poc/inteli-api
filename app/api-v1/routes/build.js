const buildController = require('../controllers/Build')
const { buildValidatedJsonHandler } = require('../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(buildController.getAll, {
      summary: 'List Builds',
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
      security: [{ bearerAuth: [] }],
      tags: ['build'],
    }),
    POST: buildValidatedJsonHandler(buildController.create, {
      summary: 'Create Build',
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
      security: [{ bearerAuth: [] }],
      tags: ['build'],
    }),
  }

  return doc
}
