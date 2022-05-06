const knex = require('knex')

const env = require('./env')

const client = knex({
  client: 'pg',
  migrations: {
    tableName: 'migrations',
  },
  connection: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  },
})


async function postOrderDb(reqBody) {
  return client('orders')
    .insert({
      owner: reqBody.owner,
      manufacturer: reqBody.manufacturer,
      status: reqBody.status,
      required_by: reqBody.requiredBy,
      items: reqBody.items,
    })
    .returning('*')
}

module.exports = {
  client,
  postOrderDb,
}
