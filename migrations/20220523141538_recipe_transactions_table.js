exports.up = async (knex) => {
  const uuidGenerateV4 = () => knex.raw('uuid_generate_v4()')
  const now = () => knex.fn.now()

  await knex.schema.createTable('recipe_transactions', (def) => {
    def.uuid('id').defaultTo(uuidGenerateV4())
    def.integer('token_id')
    def.uuid('recipe_id').notNullable()
    def.enu('type', ['Creation']).notNullable()
    def.enu('status', ['Created', 'Submitted', 'Rejected', 'Amended', 'Accepted'])
    def.datetime('created_at').notNullable().default(now())
    def.datetime('updated_at').notNullable().default(now())

    def.primary(['id'])
    def.foreign('recipe_id').references('id').on('recipes')
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTable('recipe_transactions')
}
