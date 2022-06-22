const { getDefaultSecurity } = require('../../../../../utils/auth')
const order = require('../../../../controllers/Order')
const { buildValidatedJsonHandler } = require('../../../../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(order.transaction.get, {
      summary: 'Get Purchase Orders Acceptance Action',
      description: 'Returns the details of the on-chain transaction {acceptanceId} to accept the order {id}.',
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
          description: 'Id of the purchase-order acceptance',
          in: 'path',
          required: true,
          name: 'acceptanceId',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
      ],
      responses: {
        200: {
          description: 'Return Purchase Order Acceptance Action',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrderAcceptance',
              },
            },
          },
        },
        404: {
          description: 'Acceptance action not found',
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
