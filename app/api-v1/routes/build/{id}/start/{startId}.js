const { getDefaultSecurity } = require('../../../../../utils/auth')
const buildController = require('../../../../controllers/Build')
const { buildValidatedJsonHandler } = require('../../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(buildController.transaction.get, {
      summary: 'Get Build Start Action',
      description: 'Returns the details of the on-chain transaction {startId} to start the build {id}.',
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
          description: 'Id of the build start action',
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
          description: 'Return Build Start Action',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BuildStart',
              },
            },
          },
        },
        404: {
          description: 'Order not found',
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
