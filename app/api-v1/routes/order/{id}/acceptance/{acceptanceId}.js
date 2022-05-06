// eslint-disable-next-line no-unused-vars
module.exports = function (orderService) {
  const doc = {
    GET: async function (req, res) {
      res.status(500).json({ message: 'Not Implemented' })
    },
  }

  doc.GET.apiDoc = {
    summary: 'Get Purchase Orders Acceptance Action',
    parameters: [
      {
        description: 'Id of the purchase-order',
        in: 'path',
        required: true,
        name: 'id',
        allowEmptyValue: false,
        schema: {
          $ref: '#/components/schemas/ObjectReference',
        },
      },
      {
        description: 'Id of the purchase-order acceptance',
        in: 'path',
        required: true,
        name: 'acceptanceId',
        allowEmptyValue: false,
        schema: {
          $ref: '#/components/schemas/ObjectReference',
        },
      },
    ],
    responses: {
      200: {
        description: 'Return Purchase Order Acceptance Action',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/OrderAcceptance',
            },
          },
        },
      },
      404: {
        description: 'Acceptance action not found',
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
