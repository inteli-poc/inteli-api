const { getDefaultSecurity } = require('../../../utils/auth')
const partController = require('../../controllers/Part')
const { buildValidatedJsonHandler } = require('../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(partController.get, {
      summary: 'Get Part',
      description: 'Returns the part {id}.',
      parameters: [
        {
          description: 'Id of the part to get',
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
          description: 'Return Part',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Part',
                },
              },
            },
          },
        },
        404: {
          description: 'Part not found',
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
      tags: ['part'],
    }),
  }

  return doc
}
