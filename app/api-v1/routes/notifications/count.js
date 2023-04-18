const { getDefaultSecurity } = require('../../../utils/auth')
const notifications = require('../../controllers/Notifications')
const { buildValidatedJsonHandler } = require('../../../utils/routeResponseValidator')

module.exports = function () {
  const doc = {
    GET: buildValidatedJsonHandler(notifications.getCount, {
      summary: 'Returns Purchase Order Count',
      description: 'Returns the total number of notifications.',
      parameters: [],
      responses: {
        200: {
          description: 'Return notifications Count',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NotificationsCount',
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
