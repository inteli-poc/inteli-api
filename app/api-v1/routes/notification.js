const notification = require('../controllers/Notification')
const { getDefaultSecurity } = require('../../utils/auth')

module.exports = function () {
  const doc = {
    GET: notification.get,
    POST: notification.post,
  }

  notification.get.apiDoc = {
    responses: {
      200: {
        description: 'Establish connection',
        content: {
          'text/event-stream': {
            schema: {
              $ref: '#/components/schemas/Notification',
            },
          },
        },
      },
    },
    security: getDefaultSecurity(),
  }

  notification.post.apiDoc = {
    responses: {
      201: {
        description: 'Return notifications',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Notification',
            },
          },
        },
      },
    },
    security: getDefaultSecurity(),
  }
  return doc
}
