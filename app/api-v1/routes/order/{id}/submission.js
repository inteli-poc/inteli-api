const { getDefaultSecurity } = require('../../../../utils/auth')
const orderController = require('../../../controllers/Order')
const { buildValidatedJsonHandler } = require('../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function (orderService) {
  const doc = {
    GET: buildValidatedJsonHandler(orderController.transaction.getAll, {
      summary: 'List Purchase Orders Submission Actions',
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
    POST: buildValidatedJsonHandler(orderController.transaction.create, {
      summary: 'Create Purchase Order Submission Action',
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
