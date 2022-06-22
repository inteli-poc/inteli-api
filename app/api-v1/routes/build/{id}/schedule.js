const { getDefaultSecurity } = require('../../../../utils/auth')
const buildController = require('../../../controllers/Build')
const { buildValidatedJsonHandler } = require('../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(buildController.transaction.get, {
      summary: 'List Build Schedule Actions',
      description: 'Returns the details of all on-chain transactions to schedule the build {id}.',
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
          description: 'Return Build Schedule Actions',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/BuildSchedule',
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
      description:
        'A Supplier schedules the build {id}. Build must be in `Created` state. Also creates the parts that are being specified by recipes in the build. Build is now viewable to other members.',
      summary: 'Create Build Schedule Action',
      parameters: [
        {
          description: 'Id of the build. Must be in Created state',
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
              $ref: '#/components/schemas/NewBuildSchedule',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Build Schedule Action Created',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BuildSchedule',
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
