const { getDefaultSecurity } = require('../../../../utils/auth')
const partController = require('../../../controllers/Part')
const { buildValidatedJsonHandler } = require('../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(partController.transaction.getAll('order-assignment'), {
      summary: 'List Part Order Assignment Actions',
      description: 'Returns the details of all on-chain transactions to assign the part {id} to an order.',
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
          description: 'Return Part Order Assignment Actions',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/PartOrderAssignment',
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
    POST: buildValidatedJsonHandler(partController.transaction.create('order-assignment'), {
      summary: 'Create Part Order Assignment Action',
      description: 'A Supplier assigns the part {id} to an order.',
      parameters: [
        {
          description: 'Id of the part. Must not be assigned to a purchase-order',
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
              $ref: '#/components/schemas/NewPartOrderAssignment',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Part Order Assignment Created',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PartOrderAssignment',
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
