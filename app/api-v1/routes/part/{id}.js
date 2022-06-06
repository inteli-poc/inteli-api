const partController = require('../../controllers/Part')
const { buildValidatedJsonHandler } = require('../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function (partService) {
  const doc = {
    GET: buildValidatedJsonHandler(partController.get, {
      summary: 'Get Part',
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
                $ref: '#/components/responses/NotFoundError',
              },
            },
          },
        },
        default: {
          description: 'An error occurred',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/responses/Error',
              },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
      tags: ['part'],
    }),
  }

  return doc
}
