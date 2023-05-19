const { getDefaultSecurity } = require('../../../../../utils/auth')
const machiningOrderController = require('../../../../controllers/MachiningOrder')
const { buildValidatedJsonHandler } = require('../../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(machiningOrderController.transaction.get('Start'), {
      summary: 'Get machining order Start Action',
      description: 'Returns the details of the on-chain transaction {startId} to start the machining order {id}.',
      parameters: [
        {
          description: 'Id of the machining order',
          in: 'path',
          required: true,
          name: 'id',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
        {
          description: 'Id of the machining order start action',
          in: 'path',
          required: true,
          name: 'startId',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
      ],
      responses: {
        200: {
          description: 'Return Machining order Start Action',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/MachiningOrderStart',
              },
            },
          },
        },
        404: {
          description: 'Machining order or Start Action not found',
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
