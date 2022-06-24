const { getDefaultSecurity } = require('../../../../../utils/auth')
const partController = require('../../../../controllers/Part')
const { buildValidatedJsonHandler } = require('../../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(partController.transaction.get, {
      summary: 'Get Part Metadata Update Action',
      description: 'Returns the details of the on-chain transaction {updateId} to update metadata on the part {id}.',
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
          description: 'Part or Metadata Update Action not found',
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
