// eslint-disable-next-line no-unused-vars
module.exports = function (orderService) {
  const doc = {
    GET: async function (req, res) {
      res.status(500).json({ message: 'Not Implemented' })
    },
    POST: async function (req, res) {
      try {
        const { statusCode, result } = await orderService.postProject(req.body)
        return res.status(statusCode).json(result)
      } catch (error) {
        throw 'Error: ' + error
      }
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
