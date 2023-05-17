const db = require('../../../db')
const jsConvert = require('js-convert-case')
let clients = []

module.exports = {
  get: function (request, response) {
    const headers = {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
    }
    response.writeHead(200, headers)
    response.write('\n')
    const clientId = Date.now()
    const newClient = {
      id: clientId,
      response,
    }
    clients.push(newClient)
    request.on('close', () => {
      clients = clients.filter((client) => client.id !== clientId)
    })
  },
  post: async function (request, response) {
    const newNotification = jsConvert.snakeKeys(request.body)
    let [insertedNotification] = await db.insertNotification(newNotification)
    insertedNotification.created_at = new Date(insertedNotification.created_at).toISOString()
    response.status(201)
    response.json(insertedNotification)
    return clients.forEach((client) => {
      client.response.write(`data: ${JSON.stringify(insertedNotification)}\n\n`)
      client.response.flush()
    })
  },
}
