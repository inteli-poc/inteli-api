const order = require('../controllers/Order')
const { buildValidatedJsonHandler } = require('../../utils/routeResponseValidator')
const { getDefaultSecurity } = require('../../utils/auth')

const routeCommon = { security: getDefaultSecurity(), tags: ['order'] }

const docs = {
  GET: {
    summary: 'List Purchase Orders',
    parameters: [],
    responses: {
      200: {
        description: 'Return Purchase Orders',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Order',
              },
            },
          },
        },
      },
    },
    ...routeCommon,
  },
  POST: {
    summary: 'Create Purchase Order',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/NewOrder',
          },
        }
      },
      {
        summary: 'Create Purchase Order',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NewOrder',
              },
            },
          },
        },
      },
    },
    ...routeCommon,
  },
}

module.exports = {
  GET: buildValidatedJsonHandler(order.get, docs.GET),
  POST: buildValidatedJsonHandler(order.post, docs.POST),
}
