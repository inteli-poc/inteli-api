const { getDefaultSecurity } = require('../../../../../utils/auth')
const buildController = require('../../../../controllers/Build')
const { buildValidatedJsonHandler } = require('../../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(buildController.transaction.get('Schedule'), {
      summary: 'Get Build Schedule Action',
      description: 'Returns the details of the on-chain transaction {scheduleId} to schedule the build {id}.',
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
          description: 'Id of the build schedule action',
          in: 'path',
          required: true,
          name: 'scheduleId',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
      ],
      responses: {
        200: {
          description: 'Return Build Schedule Action',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BuildSchedule',
              },
            },
          },
        },
        404: {
          description: 'Build or Schedule Action not found',
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
