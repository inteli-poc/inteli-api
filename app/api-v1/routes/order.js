const order = require('../controllers/Order')
const { buildValidatedJsonHandler } = require('../../utils/routeResponseValidator')
const { getDefaultSecurity } = require('../../utils/auth')

const routeCommon = { security: getDefaultSecurity(), tags: ['order'] }

const docs = {
  GET: {
    summary: 'List Purchase Orders',
    description: 'Returns all orders.',
    parameters: [
      {
        description: 'externalId of the purchase-order to get',
        in: 'query',
        required: false,
        name: 'externalId',
        allowEmptyValue: false,
        schema: {
          type: 'string',
        },
      },
    ],
    responses: {
      200: {
        description: 'Return Purchase Orders',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Order',
              },
            },
          },
        },
      },
    },
    ...routeCommon,
  },
  POST: {
    summary: 'Create Purchase Order',
    description:
      'A Buyer creates a new order containing a list of recipes. One part is ordered per recipe. Multiple parts can be ordered by listing the same recipe ID multiple times. Supplier in the request body must match `supplier` on each recipe. The order is not yet viewable to other members.',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/NewOrder',
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Purchase Order Created',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Order',
            },
          },
        },
      },
    },
    ...routeCommon,
  },
}

module.exports = {
  GET: buildValidatedJsonHandler(order.get, docs.GET),
  POST: buildValidatedJsonHandler(order.post, docs.POST),
}
