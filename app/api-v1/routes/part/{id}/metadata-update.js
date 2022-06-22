const { getDefaultSecurity } = require('../../../../utils/auth')
const partController = require('../../../controllers/Part')
const { buildValidatedJsonHandler } = require('../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(partController.transaction.get, {
      summary: 'List Part Metadata Update Actions',
      description: 'Returns the details of all on-chain transactions to update metadata for the part {id}.',
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
      ],
      responses: {
        200: {
          description: 'Return Part Metadata Update Actions',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/PartMetadataUpdate',
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
    POST: buildValidatedJsonHandler(partController.transaction.create, {
      summary: 'Create Part Metadata Update Action',
      description: 'A Supplier updates metadata for the part {id}.',
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
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/NewPartMetadataUpdate',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Part Metadata Updated Action Created',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PartMetadataUpdate',
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
      tags: ['part'],
    }),
  }

  return doc
}
