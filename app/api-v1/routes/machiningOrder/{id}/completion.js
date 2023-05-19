const { getDefaultSecurity } = require('../../../../utils/auth')
const machiningOrderController = require('../../../controllers/MachiningOrder')
const { buildValidatedJsonHandler } = require('../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(machiningOrderController.transaction.getAll('Completed'), {
      summary: 'List Machining Order Completion Actions',
      description: 'Returns the details of all on-chain transactions to complete the machining order {id}.',
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
          description: 'Return machining order Complete Actions',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/MachiningOrderComplete',
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
    POST: buildValidatedJsonHandler(machiningOrderController.transaction.create('Completed'), {
      summary: 'Create machining order Complete Action',
      description: 'A Supplier starts the machining order {id}. machining order must be in `Started` state.',
      parameters: [
        {
          description: 'Id of the machining order. Must be in Started state',
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
              $ref: '#/components/schemas/NewMachiningOrderComplete',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Machining Order Completion Action Created',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/MachiningOrderComplete',
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
