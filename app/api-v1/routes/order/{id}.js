const { getDefaultSecurity } = require('../../../utils/auth')
const order = require('../../controllers/Order')
const { buildValidatedJsonHandler } = require('../../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(order.getById, {
      summary: 'Get Purchase Order',
      description: 'Returns the order {id}.',
      parameters: [
        {
          description: 'Id of the purchase-order to get',
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
          description: 'Return Order',
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
