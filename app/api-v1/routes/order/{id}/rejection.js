const { getDefaultSecurity } = require('../../../../utils/auth')
const order = require('../../../controllers/Order')
const { buildValidatedJsonHandler } = require('../../../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(order.transaction.get, {
      summary: 'List Purchase Orders Rejection Actions',
      description: 'Returns the details of all on-chain transactions to reject the order {id}.',
      parameters: [
        {
          description: 'Id of the purchase-order',
          in: 'path',
          required: true,
          name: 'id',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
      ],
      responses: {
        200: {
          description: 'Return Purchase Order Rejection Actions',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/OrderRejection',
                },
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
      tags: ['order'],
    }),
    POST: buildValidatedJsonHandler(order.transaction.create, {
      summary: 'Create Purchase Order Rejection Action',
      description: 'A Supplier rejects the order {id}. Order must be in `Submitted` state.',
      parameters: [
        {
          description: 'Id of the purchase-order. Must be in "Submitted" state',
          in: 'path',
          required: true,
          name: 'id',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/NewOrderRejection',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Purchase Order Rejection Created',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrderRejection',
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
      security: getDefaultSecurity(),
      tags: ['order'],
    }),
  }

  return doc
}
