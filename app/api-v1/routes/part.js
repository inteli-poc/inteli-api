const partController = require('../controllers/Part')
const { buildValidatedJsonHandler } = require('../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(partController.getAll, {
      summary: 'List Parts',
      parameters: [],
      responses: {
        200: {
          description: 'Return Parts',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Part',
                },
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
      tags: ['part'],
    }),
  }

  return doc
}
