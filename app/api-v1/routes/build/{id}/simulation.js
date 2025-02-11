const { getDefaultSecurity } = require('../../../../utils/auth')
const buildController = require('../../../controllers/Build')
const { buildValidatedJsonHandler } = require('../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(buildController.transaction.getAll('Simulation'), {
      summary: 'List Build Simulation Actions',
      description: 'Returns the details of all on-chain transactions in Simulation Upload {id}.',
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
      ],
      responses: {
        200: {
          description: 'Return Build Simulation Actions',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/BuildSimulation',
                },
              },
            },
          },
        },
        404: {
          description: 'Build not found',
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
    POST: buildValidatedJsonHandler(buildController.transaction.create('Simulation'), {
      summary: 'Create Build Simulation Action',
      description: 'Creates a new build or uploads a Simulation design for an existing build {id}.',
      parameters: [
        {
          description: 'Id of the build where the simulation will be uploaded.',
          in: 'path',
          required: true,
          name: 'id',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/NewBuildSimulation',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Build Simulation Action Created',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BuildSimulation',
              },
            },
          },
        },
        400: {
          description: 'Invalid request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BadRequestError',
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
