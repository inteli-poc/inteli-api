const { getDefaultSecurity } = require('../../utils/auth')
const partController = require('../controllers/Part')
const { buildValidatedJsonHandler } = require('../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    POST: buildValidatedJsonHandler(partController.post, {
      summary: 'Create Part',
      description: 'Buyer creates a part',
      parameters: [],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/NewPart',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Return Parts',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Part',
              },
            },
          },
        },
      },
      security: getDefaultSecurity(),
      tags: ['part'],
    }),
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
