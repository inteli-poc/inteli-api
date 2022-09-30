const { getDefaultSecurity } = require('../../../../../utils/auth')
const order = require('../../../../controllers/Order')
const { buildValidatedJsonHandler } = require('../../../../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(order.transaction.getById('Cancellation'), {
      summary: 'Get Purchase Orders Cancellation Action',
      description: 'Returns the details of the on-chain transaction {CancellationId} to accept the order {id}.',
      parameters: [
        {
          description: 'Id of the purchase-order',
          in: 'path',
          required: true,
          name: 'id',
          allowEmptyValue: false,
          schema: {
            type: 'string',
            format: 'uuid',
          },
        },
        {
          description: 'Id of the purchase-order Cancellation',
          in: 'path',
          required: true,
          name: 'CancellationId',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
      ],
      responses: {
        200: {
          description: 'Return Purchase Order Cancellation Action',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrderCancellation',
              },
            },
          },
        },
        404: {
          description: 'Order or Cancellation Action not found',
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
