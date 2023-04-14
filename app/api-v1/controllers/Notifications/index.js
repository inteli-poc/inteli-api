const db = require('../../../db')
const jsConvert = require('js-convert-case')

module.exports = {
  getAll: async function () {
    let notifications = await db.getNotifications()
    notifications = notifications.map((item) => {
      item.created_at = new Date(item.created_at).toISOString()
      return jsConvert.camelKeys(item)
    })
    return {
      status: 200,
      response: notifications,
    }
  },
}
