const { getDefaultSecurity } = require('../../../../utils/auth')
const order = require('../../../controllers/Order')
const { buildValidatedJsonHandler } = require('../../../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(order.transaction.get('Submission'), {
      summary: 'List Purchase Orders Submission Actions',
      description: 'Returns the details of all on-chain transactions to submit the order {id}.',
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
          description: 'Return Purchase Order Submission Actions',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/OrderSubmission',
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
    POST: buildValidatedJsonHandler(order.transaction.create('Submission'), {
      summary: 'Create Purchase Order Submission Action',
      description:
        'A Buyer submits the order {id}. Order must be in `Created` state. Order is now viewable to other members.',
      parameters: [
        {
          description: 'Id of the purchase-order. Must be in "Created" state',
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
              $ref: '#/components/schemas/NewOrderSubmission',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Purchase Order Submission Created',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrderSubmission',
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
