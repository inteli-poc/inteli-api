const { getDefaultSecurity } = require('../../../../../utils/auth')
const buildController = require('../../../../controllers/Build')
const { buildValidatedJsonHandler } = require('../../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(buildController.transaction.get('Simulation'), {
      summary: 'Get Build Simulation Action',
      description: 'Retrieves the details of the on-chain Simulation transaction {SimulationId} for the build {id}.',
      parameters: [
        {
          description: 'Id of the build',
          in: 'path',
          required: true,
          name: 'id',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
        {
          description: 'Unique transaction ID for the Simulation process of the build',
          in: 'path',
          required: true,
          name: 'SimulationId',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
      ],
      responses: {
        200: {
          description: 'Return Build Simulation Action',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BuildSimulation',
              },
            },
          },
        },
        404: {
          description: 'Build or Simulation transaction not found',
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
      tags: ['build'],
    }),
  }

  return doc
}
