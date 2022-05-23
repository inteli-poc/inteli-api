exports.up = async (knex) => {
  // check extension is not installed
  const [extInstalled] = await knex('pg_extension').select('*').where({ extname: 'uuid-ossp' })

  if (!extInstalled) {
    await knex.raw('CREATE EXTENSION "uuid-ossp"')
  }

  const uuidGenerateV4 = () => knex.raw('uuid_generate_v4()')
  const now = () => knex.fn.now()

  await knex.schema.createTable('recipe_transactions', (def) => {
    def.uuid('id').defaultTo(uuidGenerateV4())
    def.integer('token_id').unsigned().notNullable()
    def.uuid('recipe_id').notNullable()
    def.enu('status', ['submitted', 'minted'])
    def.datetime('created_at').notNullable().default(now())

    // TODO - how to handle hasMany relationships? e.g. each recipe/order can have multiple transactions
    def.primary(['id'])
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTable('transactions')
}
