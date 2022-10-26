const { getDefaultSecurity } = require('../../../../utils/auth')
const partController = require('../../../controllers/Part')
const { buildValidatedJsonHandler } = require('../../../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(partController.transaction.getAll('Creation'), {
      summary: 'List Part Creation Actions',
      description: 'Returns the details of all on-chain transactions to create the part {id}.',
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
      responses: {
        200: {
          description: 'Return Part Creation Actions',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/PartCreation',
                },
              },
            },
          },
        },
        404: {
          description: 'Part not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NotFoundError',
              },
            },
          },
        },
      },
      tags: ['part'],
    }),
    POST: buildValidatedJsonHandler(partController.transaction.create('Creation'), {
      summary: 'Create Part Creation Action',
      description: 'A buyer creates the part {id}. Part is now viewable to other members',
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
              $ref: '#/components/schemas/NewPartCreation',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Part Creation Created',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PartCreation',
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
