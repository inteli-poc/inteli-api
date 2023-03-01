const { getDefaultSecurity } = require('../../../../../utils/auth')
const machiningOrderController = require('../../../../controllers/MachiningOrder')
const { buildValidatedJsonHandler } = require('../../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(machiningOrderController.transaction.get('Accepted'), {
      summary: 'Get machining order Accepted Action',
      description: 'Returns the details of the on-chain transaction {completeId} to accept the machining order {id}.',
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
          description: 'Id of the machining order accept action',
          in: 'path',
          required: true,
          name: 'acceptedId',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
      ],
      responses: {
        200: {
          description: 'Return machining order accept Action',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/MachiningOrderAcceptance',
              },
            },
          },
        },
        404: {
          description: 'Machining order or accept Action not found',
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
