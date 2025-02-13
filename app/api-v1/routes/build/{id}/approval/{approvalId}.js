const { getDefaultSecurity } = require('../../../../../utils/auth')
const buildController = require('../../../../controllers/Build')
const { buildValidatedJsonHandler } = require('../../../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(buildController.transaction.get('Approval'), {
      summary: 'Get Build Approval Action',
      description: 'Returns the details of the on-chain transaction {approveID} to approve the build {id}.',
      parameters: [
        {
          description: 'Id of the build',
          in: 'path',
          required: true,
          name: 'id',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
        {
          description: 'Id of the build approve action',
          in: 'path',
          required: true,
          name: 'approvalId',
          allowEmptyValue: false,
          schema: {
            $ref: '#/components/schemas/ObjectReference',
          },
        },
      ],
      responses: {
        200: {
          description: 'Return Build Approve Action',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BuildApproval',
              },
            },
          },
        },
        404: {
          description: 'Build or Approve Action not found',
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
      tags: ['build'],
    }),
  }

  return doc
}
