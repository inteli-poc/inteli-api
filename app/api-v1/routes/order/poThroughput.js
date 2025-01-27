const { getDefaultSecurity } = require('../../../utils/auth')
const order = require('../../controllers/Order')
const { buildValidatedJsonHandler } = require('../../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(order.getPOThroughputStatusByMonth, {
      summary: 'List Purchase Order throughput Status for past 6 months',
      description: 'Returns the details of all on-chain orders from the past 6 months.',
      parameters: [
      {
        in: 'query',
        name: 'supplier',
        description: 'Supplier code to filter the orders (optional)',
        required: false,
        schema: {
          type: 'string',
        },
      },],
      responses: {
        200: {
          description: 'Return Purchase Order delivery status',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/orderThroughputStatus',
              },
            },
          },
        },
        404: {
          description: 'Order Status not found',
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
