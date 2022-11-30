const { getDefaultSecurity } = require('../../../../../utils/auth')
const order = require('../../../../controllers/Order')
const { buildValidatedJsonHandler } = require('../../../../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(order.transaction.getById('Acknowledgement'), {
      summary: 'Get Purchase Orders Rejection Action',
      description: 'Returns the details of the on-chain transaction {acknowledgementId} to acknowledge the order {id}.',
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
          description: 'Id of the acknowledgement action',
          in: 'path',
          required: true,
          name: 'acknowledgementId',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
      ],
      responses: {
        200: {
          description: 'Return Purchase Order acknowledgement Action',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrderAcknowledgement',
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
