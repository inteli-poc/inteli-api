// eslint-disable-next-line no-unused-vars
const { BadRequestError } = require('../../utils/errors')
module.exports = function (orderService, identityService) {
  const doc = {
    GET: async function (req, res) {
      res.status(500).json({ message: 'Not Implemented' })
    },
    POST: async function (req, res) {
      console.log('*** *** 1 HELLO REQUEST CALLD')

      const responseOne = await identityService.getMemberByAlias(req, req.body.supplier)
      console.log('*** 1 responseOne', responseOne)

      // const responseTwo = await identityService.getMemberBySelf(req.body)
      // console.log('*** *** 1 responseTwo', responseTwo)
      // console.log('*** 1 supplier', supplier)

      const { statusCode, result } = await orderService.postOrder({
        ...req.body,
        supplier: '', // supplierAddress,
        purchaserAddress: '', // supplier,
      })

      console.log('*** 1 result', result)

      if (!req.body) {
        throw new BadRequestError({ message: 'No body uploaded', service: 'order' })
      }
      return res.status(statusCode).json({ ...result[0], supplier: req.body.supplier })
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
