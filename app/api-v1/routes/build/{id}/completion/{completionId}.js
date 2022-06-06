const buildController = require('../../../../controllers/Build')
const { buildValidatedJsonHandler } = require('../../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function (buildService) {
  const doc = {
    GET: buildValidatedJsonHandler(buildController.transaction.get, {
      summary: 'Get Build Completion Action',
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
          description: 'Id of the build completion action',
          in: 'path',
          required: true,
          name: 'completionId',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
      ],
      responses: {
        200: {
          description: 'Return Build Completion Action',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BuildCompletion',
              },
            },
          },
        },
        404: {
          description: 'Build Completion Action not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NotFoundError',
              },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
      tags: ['build'],
    }),
  }

  return doc
}
