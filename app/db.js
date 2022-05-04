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

const insertAttachment = async (name, fileData) => {
  return await client('attachments').insert({ filename: name, binary_blob: fileData }).returning(['id', 'filename'])
}

module.exports = {
  client,
  insertAttachment,
}
