const { getDefaultSecurity } = require('../../../utils/auth')
const order = require('../../controllers/Order')
const { buildValidatedJsonHandler } = require('../../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(order.getCount, {
      summary: 'Returns Purchase Order Count',
      description: 'Returns the total number of orders.',
      parameters: [],
      responses: {
        200: {
          description: 'Return Purchase Order Count',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/orderCount',
              },
            },
          },
        },
      },
      security: getDefaultSecurity(),
      tags: ['order'],
    }),
  }

  return doc
}
