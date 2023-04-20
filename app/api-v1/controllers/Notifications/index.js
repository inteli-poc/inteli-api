const db = require('../../../db')
const jsConvert = require('js-convert-case')

module.exports = {
  getAll: async function (req) {
    let notifications = await db.getNotifications(req.query.limit, req.query.page, req.query.read)
    notifications = await Promise.all(
      notifications.map(async (item) => {
        let read = true
        let del = false
        let subNotificationsRead = await db.getNotificationsByOrderId(item.order_id, read, item.id, del)
        subNotificationsRead = subNotificationsRead.map((subItemRead) => {
          subItemRead.created_at = new Date(subItemRead.created_at).toISOString()
          return jsConvert.camelKeys(subItemRead)
        })
        item.readNotifications = subNotificationsRead
        read = false
        let subNotificationsUnread = await db.getNotificationsByOrderId(item.order_id, read, item.id, del)
        subNotificationsUnread = subNotificationsUnread.map((subItemUnread) => {
          subItemUnread.created_at = new Date(subItemUnread.created_at).toISOString()
          return jsConvert.camelKeys(subItemUnread)
        })
        item.unreadNotifications = subNotificationsUnread
        item.created_at = new Date(item.created_at).toISOString()
        return jsConvert.camelKeys(item)
      })
    )
    notifications.sort((a, b) => {
      let time1 = new Date(a.createdAt)
      let timeStamp1 = time1.getTime()
      let time2 = new Date(b.createdAt)
      let timeStamp2 = time2.getTime()
      return timeStamp2 - timeStamp1
    })
    return {
      status: 200,
      response: notifications,
    }
  },
  updateNotification: async function (req) {
    let notifications = req.body.notifications
    for (let index = 0; index < notifications.length; index++) {
      await db.updateNotification(notifications[index].read, notifications[index].delete, notifications[index].id)
    }
    return {
      status: 201,
      response: req.body,
    }
  },
  getCount: async function (req) {
    let notificationsCount = await db.getNotificationsCount(req.query.read)
    return {
      status: 200,
      response: {
        count: parseInt(!req.query.read ? notificationsCount.length : notificationsCount[0].count),
      },
    }
  },
}
