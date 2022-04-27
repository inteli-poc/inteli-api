// eslint-disable-next-line no-unused-vars
module.exports = function (orderService) {
  const doc = {
    GET: async function (req, res) {
      res.status(500).json({ message: 'Not Implemented' })
    },
  }

  doc.GET.apiDoc = {
    summary: 'Get Purchase Orders Rejection Action',
    parameters: [
      {
        description: 'Id of the purchase-order',
        in: 'path',
        required: true,
        name: 'id',
        allowEmptyValue: false,
      },
      {
        description: 'Id of the rejection action',
        in: 'path',
        required: true,
        name: 'rejectionId',
        allowEmptyValue: false,
      },
    ],
    responses: {
      200: {
        description: 'Return Purchase Order Rejection Action',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/OrderRejection',
            },
          },
        },
      },
      404: {
        description: 'Rejection action not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/responses/NotFoundError',
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
    tags: ['order'],
  }

  return doc
}
