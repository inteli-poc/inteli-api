const { getDefaultSecurity } = require('../../../../../utils/auth')
const order = require('../../../../controllers/Order')
const { buildValidatedJsonHandler } = require('../../../../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(order.transaction.get('Rejection'), {
      summary: 'Get Purchase Orders Rejection Action',
      description: 'Returns the details of the on-chain transaction {rejectionId} to reject the order {id}.',
      parameters: [
        {
          description: 'Id of the purchase-order',
          in: 'path',
          required: true,
          name: 'id',
          allowEmptyValue: false,
          schema: {
            type: 'string',
            format: 'uuid'
          },
        },
        {
          description: 'Id of the rejection action',
          in: 'path',
          required: true,
          name: 'rejectionId',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
      ],
      responses: {
        200: {
          description: 'Return Purchase Order Rejection Action',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrderRejection',
              },
            },
          },
        },
        404: {
          description: 'Order or Rejection Action not found',
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
