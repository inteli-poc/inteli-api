const { getDefaultSecurity } = require('../../../../../utils/auth');
const buildController = require('../../../../controllers/Build');
const { buildValidatedJsonHandler } = require('../../../../../utils/routeResponseValidator');

// eslint-disable-next-line no-unused-vars
module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(buildController.transaction.get('Creation'), {
      summary: 'Get Build Creation Action',
      description: 'Returns the details of the on-chain transaction {creationId} that marks the build {id} as Created.',
      parameters: [
        {
          description: 'ID of the build',
          in: 'path',
          required: true,
          name: 'id',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
        {
          description: 'ID of the build creation transaction',
          in: 'path',
          required: true,
          name: 'creationId',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
      ],
      responses: {
        200: {
          description: 'Return Build Creation Action',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BuildCreation',
              },
            },
          },
        },
        404: {
          description: 'Build or Creation Action not found',
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
  };

  return doc;
};
