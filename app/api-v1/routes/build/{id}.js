const { getDefaultSecurity } = require('../../../utils/auth')
const buildController = require('../../controllers/Build')
const { buildValidatedJsonHandler } = require('../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(buildController.getById, {
      summary: 'Get Build',
      description: 'Returns the build {id}.',
      parameters: [
        {
          description: 'Id of the build to get',
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
          description: 'Return Build',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Build',
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
  }

  return doc
}
