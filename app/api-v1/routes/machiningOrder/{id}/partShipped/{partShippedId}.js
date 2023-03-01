const { getDefaultSecurity } = require('../../../../../utils/auth')
const machiningOrderController = require('../../../../controllers/MachiningOrder')
const { buildValidatedJsonHandler } = require('../../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(machiningOrderController.transaction.get('Part Shipped'), {
      summary: 'Get machining order part shipped Action',
      description:
        'Returns the details of the on-chain transaction {partShippedId} to part ship the machining order {id}.',
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
          description: 'Id of the machining order part shipped action',
          in: 'path',
          required: true,
          name: 'partShippedId',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
      ],
      responses: {
        200: {
          description: 'Return machining order part shipped Action',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/MachiningOrderPartShipped',
              },
            },
          },
        },
        404: {
          description: 'Machining order or part shipped Action not found',
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
