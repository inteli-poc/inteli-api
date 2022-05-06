const { client } = require('../../app/db')

const cleanup = async () => {
  await client('orders').del()
}

module.exports = {
  cleanup,
}
