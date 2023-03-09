const { getDefaultSecurity } = require('../../../utils/auth')
const machiningOrder = require('../../controllers/MachiningOrder')
const { buildValidatedJsonHandler } = require('../../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(machiningOrder.getCount, {
      summary: 'Returns Machining Order Count',
      description: 'Returns the total number of machining orders.',
      parameters: [],
      responses: {
        200: {
          description: 'Return Machining Order Count',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/machiningOrderCount',
              },
            },
          },
        },
      },
      security: getDefaultSecurity(),
      tags: ['machining order'],
    }),
  }

  return doc
}
