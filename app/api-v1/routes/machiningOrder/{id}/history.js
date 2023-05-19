const { getDefaultSecurity } = require('../../../../utils/auth')
const machiningOrder = require('../../../controllers/MachiningOrder')
const { buildValidatedJsonHandler } = require('../../../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(machiningOrder.transaction.getHistory, {
      summary: 'List Machining Order history',
      description: 'Returns the details of all on-chain transactions machining order {id}.',
      parameters: [
        {
          description: 'Id of the machining-order',
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
          description: 'Return machining Order history',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/machiningOrderHistory',
              },
            },
          },
        },
        404: {
          description: 'machining order not found',
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
      tags: ['machining order'],
    }),
  }

  return doc
}
