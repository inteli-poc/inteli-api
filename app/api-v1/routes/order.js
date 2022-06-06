const orderController = require('../controllers/Order')
const { buildValidatedJsonHandler } = require('../../utils/routeResponseValidator')
const { BadRequestError } = require('../../utils/errors')

module.exports = function (orderService, identityService) {
  const doc = {
    GET: buildValidatedJsonHandler(orderController.getAll, {
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
      security: [{ bearerAuth: [] }],
      tags: ['order'],
    }),
    POST: buildValidatedJsonHandler(
      async function (req) {
        if (!req.body) {
          throw new BadRequestError({ message: 'No body uploaded', req })
        }

        const { address: supplierAddress } = await identityService.getMemberByAlias(req, req.body.supplier)
        const selfAddress = await identityService.getMemberBySelf(req)
        const { alias: selfAlias } = await identityService.getMemberByAlias(req, selfAddress)

        const { statusCode, result } = await orderService.postOrder({
          ...req.body,
          supplier: supplierAddress,
          purchaserAddress: selfAlias,
        })

        return {
          status: statusCode,
          response: {
            id: result.id,
            status: 'Created',
            purchaser: selfAlias,
            ...req.body,
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
        responses: {
          201: {
            description: 'Purchase Order Created',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Order',
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
        security: [{ bearerAuth: [] }],
        tags: ['order'],
      }
    ),
  }

  return doc
}
