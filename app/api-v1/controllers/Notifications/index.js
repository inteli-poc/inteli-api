const db = require('../../../db')
const jsConvert = require('js-convert-case')

module.exports = {
  getAll: async function (req) {
    let notifications = await db.getNotifications(req.query.limit, req.query.page, req.query.read)
    notifications = notifications.map((item) => {
      item.created_at = new Date(item.created_at).toISOString()
      return jsConvert.camelKeys(item)
    })
    return {
      status: 200,
      response: notifications,
    }
  },
  getCount: async function (req) {
    let notificationsCount = await db.getNotificationsCount(req.query.read)
    return {
      status: 200,
      response: {
        count: parseInt(notificationsCount[0].count),
      },
    }
  },
}
