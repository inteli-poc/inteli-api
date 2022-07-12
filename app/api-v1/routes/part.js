const { getDefaultSecurity } = require('../../utils/auth')
const partController = require('../controllers/Part')
const { buildValidatedJsonHandler } = require('../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(partController.getAll, {
      summary: 'List Parts',
      description: 'Returns all parts.',
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
      },
      security: getDefaultSecurity(),
      tags: ['part'],
    }),
  }

  return doc
}
