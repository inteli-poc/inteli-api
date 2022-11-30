const { getDefaultSecurity } = require('../../../utils/auth')
const order = require('../../controllers/Order')
const { buildValidatedJsonHandler } = require('../../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(order.getSummary, {
      summary: 'List Purchase Order Summary',
      description: 'Returns the details of all on-chain transactions to cancel the order {id}.',
      parameters: [],
      responses: {
        200: {
          description: 'Return Purchase Order Summary',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/orderSummary',
              },
            },
          },
        },
        404: {
          description: 'Order not found',
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
      tags: ['order'],
    }),
  }

  return doc
}
