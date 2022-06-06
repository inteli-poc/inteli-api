const partController = require('../../../../controllers/Part')
const { buildValidatedJsonHandler } = require('../../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function (partService) {
  const doc = {
    GET: buildValidatedJsonHandler(partController.transaction.get, {
      summary: 'Get Part Order Assignment Action',
      parameters: [
        {
          description: 'Id of the part',
          in: 'path',
          required: true,
          name: 'id',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
        {
          description: 'Id of the part order assignment action',
          in: 'path',
          required: true,
          name: 'assignmentId',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
      ],
      responses: {
        200: {
          description: 'Return Part Order Assignment Action',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PartOrderAssignment',
              },
            },
          },
        },
        404: {
          description: 'Part Order Assignment not found',
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
