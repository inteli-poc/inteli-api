const { getDefaultSecurity } = require('../../../utils/auth')
const machiningOrderController = require('../../controllers/MachiningOrder')
const { buildValidatedJsonHandler } = require('../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(machiningOrderController.getById, {
      summary: 'Get Machining Order',
      description: 'Returns the machining order {id}.',
      parameters: [
        {
          description: 'Id of the machining order to get',
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
          description: 'Return Machining Order',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/MachiningOrder',
              },
            },
          },
        },
        404: {
          description: 'Machining order not found',
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
  }

  return doc
}
