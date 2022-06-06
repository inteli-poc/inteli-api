const partController = require('../../../../controllers/Part')
const { buildValidatedJsonHandler } = require('../../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function (partService) {
  const doc = {
    GET: buildValidatedJsonHandler(partController.transaction.get, {
      summary: 'Get Part Metadata Update Action',
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
          description: 'Id of the Part Metadata Update action',
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
          description: 'Return Part Metadata Update Action',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PartMetadataUpdate',
              },
            },
          },
        },
        404: {
          description: 'Part Metadata Update not found',
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
