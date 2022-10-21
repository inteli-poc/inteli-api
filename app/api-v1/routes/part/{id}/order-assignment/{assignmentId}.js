const { getDefaultSecurity } = require('../../../../../utils/auth')
const partController = require('../../../../controllers/Part')
const { buildValidatedJsonHandler } = require('../../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(partController.transaction.get('order-assignment'), {
      summary: 'Get Part Order Assignment Action',
      description:
        'Returns the details of the on-chain transaction {assignmentId} to assign the part {id} to an order.',
      parameters: [
        {
          description: 'Id of the part',
          in: 'path',
          required: true,
          name: 'id',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
        {
          description: 'Id of the part order assignment action',
          in: 'path',
          required: true,
          name: 'assignmentId',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
      ],
      responses: {
        200: {
          description: 'Return Part Order Assignment Action',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PartOrderAssignment',
              },
            },
          },
        },
        404: {
          description: 'Part or Order Assignment Action not found',
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
      tags: ['part'],
    }),
  }

  return doc
}
