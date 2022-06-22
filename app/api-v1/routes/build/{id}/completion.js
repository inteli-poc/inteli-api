const { getDefaultSecurity } = require('../../../../utils/auth')
const buildController = require('../../../controllers/Build')
const { buildValidatedJsonHandler } = require('../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function (buildService) {
  const doc = {
    GET: buildValidatedJsonHandler(buildController.transaction.get, {
      summary: 'List Build Completion Actions',
      description: 'Returns the details of all on-chain transactions to complete the build {id}.',
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
          description: 'Return Build Completion Actions',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/BuildCompletion',
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
    POST: buildValidatedJsonHandler(buildController.transaction.create, {
      summary: 'Create Build Completion Action',
      description: 'A Supplier completes the build {id}. Build must be in `Started` state.',
      parameters: [
        {
          description: 'Id of the build. Must be in Started state',
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
              $ref: '#/components/schemas/NewBuildCompletion',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Build Completion Action Created',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BuildCompletion',
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
