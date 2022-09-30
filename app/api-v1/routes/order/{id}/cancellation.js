const { getDefaultSecurity } = require('../../../../utils/auth')
const order = require('../../../controllers/Order')
const { buildValidatedJsonHandler } = require('../../../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(order.transaction.get('Cancellation'), {
      summary: 'List Purchase Orders Cancellation Actions',
      description: 'Returns the details of all on-chain transactions to cancel the order {id}.',
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
      ],
      responses: {
        200: {
          description: 'Return Purchase Order Cancellation Actions',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/OrderCancellation',
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
      security: getDefaultSecurity(),
      tags: ['order'],
    }),
    POST: buildValidatedJsonHandler(order.transaction.create('Cancellation'), {
      summary: 'Create Purchase Order Cancellation Action',
      description: 'A Supplier accepts the order {id}. Order must be in `Submitted` or `Amended` state.',
      parameters: [
        {
          description: 'Id of the purchase-order. Must be in "Submitted" or "Amended" state',
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
              $ref: '#/components/schemas/NewOrderCancellation',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Purchase Order Cancellation Created',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrderAcceptance',
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
