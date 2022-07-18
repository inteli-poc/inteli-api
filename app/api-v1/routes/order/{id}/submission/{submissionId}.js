const { getDefaultSecurity } = require('../../../../../utils/auth')
const order = require('../../../../controllers/Order')
const { buildValidatedJsonHandler } = require('../../../../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(order.transaction.getById('Submission'), {
      summary: 'Get Purchase Orders Submission Action',
      description: 'Returns the details of the on-chain transaction {submissionId} to submit the order {id}.',
      parameters: [
        {
          description: 'Id of the purchase-order',
          in: 'path',
          required: true,
          name: 'id',
          allowEmptyValue: false,
          schema: {
            type: 'string',
            format: 'uuid'
          },
        },
        {
          description: 'Id of the submission action',
          in: 'path',
          required: true,
          name: 'submissionId',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
      ],
      responses: {
        200: {
          description: 'Return Purchase Order Submission Action',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrderSubmission',
              },
            },
          },
        },
        404: {
          description: 'Order or Submission Action not found',
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
      tags: ['order'],
    }),
  }

  return doc
}
