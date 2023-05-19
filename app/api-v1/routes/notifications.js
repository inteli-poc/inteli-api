const { buildValidatedJsonHandler } = require('../../utils/routeResponseValidator')
const notifications = require('../controllers/Notifications')
const { getDefaultSecurity } = require('../../utils/auth')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(notifications.getAll, {
      summary: 'List notifications',
      description: 'Returns all notifications.',
      parameters: [],
      responses: {
        200: {
          description: 'Return notifications',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Notification',
                },
              },
            },
          },
        },
      },
      security: getDefaultSecurity(),
      tags: ['notifications'],
    }),
    POST: buildValidatedJsonHandler(notifications.updateNotification, {
      summary: 'updates notification',
      description: 'updates notification',
      parameters: [],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateNotification',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Return Notification',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateNotification',
              },
            },
          },
        },
      },
      security: getDefaultSecurity(),
      tags: ['notifications'],
    }),
  }

  return doc
}
