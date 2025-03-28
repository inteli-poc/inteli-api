const { getDefaultSecurity } = require('../../../../utils/auth')
const partController = require('../../../controllers/Part')
const { buildValidatedJsonHandler } = require('../../../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    POST: buildValidatedJsonHandler(partController.postException, {
      summary: 'Create Part Exception',
      description: 'A supplier creates a PO step exception for a part.',
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
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/PartExceptionCreation',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Part Exception Created',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PartException',
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
      security: getDefaultSecurity(),
      tags: ['part'],
    }),
    PUT: buildValidatedJsonHandler(partController.updateExceptionStatus, {
      summary: 'Update Part Exception status',
      description: 'A buyer can acknowledge or decline an exception which will upadte the status of the exception.',
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
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/PartExceptionStatus',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Part Exception Created',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PartException',
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
      security: getDefaultSecurity(),
      tags: ['part'],
    }),
  }

  return doc
}
