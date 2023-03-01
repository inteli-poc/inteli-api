const machiningOrder = require('../controllers/MachiningOrder')
const { buildValidatedJsonHandler } = require('../../utils/routeResponseValidator')
const { getDefaultSecurity } = require('../../utils/auth')

const routeCommon = { security: getDefaultSecurity(), tags: ['order'] }

const docs = {
  GET: {
    summary: 'List Machining Orders',
    description: 'Returns all machining orders.',
    parameters: [
      {
        description: 'externalId of the machining-order to get',
        in: 'query',
        required: false,
        name: 'externalId',
        allowEmptyValue: false,
        schema: {
          type: 'string',
        },
      },
    ],
    responses: {
      200: {
        description: 'Return machining Orders',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/MachiningOrder',
              },
            },
          },
        },
      },
    },
    ...routeCommon,
  },
  POST: {
    summary: 'Create machining Order',
    description:
      'A Buyer creates a new order containing a list of recipes. One part is ordered per recipe. Multiple parts can be ordered by listing the same recipe ID multiple times. Supplier in the request body must match `supplier` on each recipe. The order is not yet viewable to other members.',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/NewMachiningOrder',
          },
        },
      },
    },
    responses: {
      201: {
        description: 'machining Order Created',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/MachiningOrder',
            },
          },
        },
      },
    },
    ...routeCommon,
  },
}

module.exports = {
  GET: buildValidatedJsonHandler(machiningOrder.get, docs.GET),
  POST: buildValidatedJsonHandler(machiningOrder.post, docs.POST),
}
