const { getDefaultSecurity } = require('../../../../utils/auth')
const machiningOrderController = require('../../../controllers/MachiningOrder')
const { buildValidatedJsonHandler } = require('../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(machiningOrderController.transaction.getAll('Part Shipped'), {
      summary: 'List Machining Order part shipped Actions',
      description: 'Returns the details of all on-chain transactions to part ship the machining order {id}.',
      parameters: [
        {
          description: 'Id of the machining order',
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
          description: 'Return machining order part shipped Actions',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/MachiningOrderPartShipped',
                },
              },
            },
          },
        },
        404: {
          description: 'machining order not found',
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
      tags: ['machining order'],
    }),
    POST: buildValidatedJsonHandler(machiningOrderController.transaction.create('Part Shipped'), {
      summary: 'Create machining order part shipped Action',
      description: 'A Supplier starts the machining order {id}. machining order must be in `Completed` state.',
      parameters: [
        {
          description: 'Id of the machining order. Must be in Completed state',
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
              $ref: '#/components/schemas/NewMachiningOrderPartShipped',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Machining Order Part Shipped Action Created',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/MachiningOrderPartShipped',
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
      tags: ['machining order'],
    }),
  }

  return doc
}
