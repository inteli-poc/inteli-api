const { getDefaultSecurity } = require('../../../../../utils/auth')
const orderController = require('../../../../controllers/Order')
const { buildValidatedJsonHandler } = require('../../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function (orderService) {
  const doc = {
    GET: buildValidatedJsonHandler(orderController.transaction.get, {
      summary: 'Get Purchase Orders Amendment Action',
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
        {
          description: 'Id of the Amendment action',
          in: 'path',
          required: true,
          name: 'amendmentId',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
      ],
      responses: {
        200: {
          description: 'Return Purchase Order Amendment Action',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrderAmendment',
              },
            },
          },
        },
        404: {
          description: 'Amendment action not found',
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
