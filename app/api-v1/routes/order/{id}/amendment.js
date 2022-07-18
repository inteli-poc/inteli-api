const { getDefaultSecurity } = require('../../../../utils/auth')
const order = require('../../../controllers/Order')
const { buildValidatedJsonHandler } = require('../../../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(order.transaction.get('Amendment'), {
      summary: 'List Purchase Orders Amendment Actions',
      description: 'Returns the details of all on-chain transactions to amend the order {id}.',
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
      ],
      responses: {
        200: {
          description: 'Return Purchase Order Amendment Actions',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/OrderAmendment',
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
    POST: buildValidatedJsonHandler(order.transaction.create('Amendment'), {
      summary: 'Create Purchase Order Amendment Action',
      description: 'A Buyer amends the order {id}. Order must be in `Rejected` state.',
      parameters: [
        {
          description: 'Id of the purchase-order. Must be in "Rejected" state',
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
              $ref: '#/components/schemas/NewOrderAmendment',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Purchase Order Amendment Created',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrderAmendment',
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
      tags: ['order'],
    }),
  }

  return doc
}
