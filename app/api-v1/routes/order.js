// eslint-disable-next-line no-unused-vars
const { BadRequestError } = require('../../utils/errors')
module.exports = function (orderService, identityService) {
  const doc = {
    GET: async function (req, res) {
      res.status(500).json({ message: 'Not Implemented' })
    },
    POST: async function (req, res) {
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

      return res.status(statusCode).json({
        id: result.id,
        status: 'Created',
        purchaser: selfAlias,
        ...req.body,
      })
    },
  }

  doc.GET.apiDoc = {
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
    tags: ['order'],
  }

  doc.POST.apiDoc = {
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
              $ref: '#/components/responses/BadRequestError',
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
    tags: ['order'],
  }

  return doc
}
