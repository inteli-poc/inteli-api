const { getDefaultSecurity } = require('../../../../../utils/auth')
const buildController = require('../../../../controllers/Build')
const { buildValidatedJsonHandler } = require('../../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(buildController.transaction.get, {
      summary: 'Get Build Progress Update Action',
      description: 'Returns the details of the on-chain transaction {updateId} to update progress of the build {id}.',
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
          description: 'Id of the build progress update action',
          in: 'path',
          required: true,
          name: 'updateId',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
      ],
      responses: {
        200: {
          description: 'Return Build Progress Update Action',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BuildProgressUpdate',
              },
            },
          },
        },
        404: {
          description: 'Build or Progress Update Action not found',
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
