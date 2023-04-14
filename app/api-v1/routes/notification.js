const notification = require('../controllers/Notification')

module.exports = function () {
  const doc = {
    GET: notification.get,
    POST: notification.post,
  }

  return doc
}
