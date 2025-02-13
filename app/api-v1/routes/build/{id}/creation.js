const { getDefaultSecurity } = require('../../../../utils/auth');
const buildController = require('../../../controllers/Build');
const { buildValidatedJsonHandler } = require('../../../../utils/routeResponseValidator');

// eslint-disable-next-line no-unused-vars
module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(buildController.transaction.getAll('Creation'), {
      summary: 'List Build Creation Actions',
      description: 'Returns the details of all on-chain transactions that marked the build as `Created`.',
      parameters: [
        {
          description: 'Unique ID of the build',
          in: 'path',
          required: true,
          name: 'id',
          allowEmptyValue: false,
          schema: {
            type: 'string',
            format: 'uuid',
          },
        },
      ],
      responses: {
        200: {
          description: 'Returns an array of build creation transactions',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/BuildCreation', 
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
    POST: buildValidatedJsonHandler(buildController.transaction.create('Creation'), {
      summary: 'Create Build Creation Action',
      description: 'A Supplier initiates the build creation process for a given build {id}. The build must be in `Approved` state before this action.',
      parameters: [
        {
          description: 'Unique ID of the build. Must be in `Approved` state.',
          in: 'path',
          required: true,
          name: 'id',
          allowEmptyValue: false,
          schema: {
            type: 'string',
            format: 'uuid',
          },
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/NewBuildCreation', 
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Build Creation Action Successfully Created',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BuildCreation',
              },
            },
          },
        },
        400: {
          description: 'Invalid request data',
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
  };

  return doc;
};
