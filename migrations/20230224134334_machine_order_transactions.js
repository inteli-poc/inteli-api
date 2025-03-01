exports.up = async (knex) => {
  const uuidGenerateV4 = () => knex.raw('uuid_generate_v4()')
  const now = () => knex.fn.now()

  await knex.schema.createTable('machining_order_transactions', (def) => {
    def.uuid('id').defaultTo(uuidGenerateV4())
    def.integer('token_id')
    def.uuid('machining_order_id').notNullable()
    def.enu('type', ['Submitted', 'Accepted', 'Start', 'Completed', 'Part Shipped']).notNullable()
    def.enum('status', ['Submitted', 'InBlock', 'Finalised', 'Failed'], {
      enumName: 'tx_status',
      useNative: true,
      existingType: true,
    })
    def.datetime('created_at').notNullable().default(now())
    def.datetime('updated_at').notNullable().default(now())

    def.primary(['id'])
    def.foreign('machining_order_id').references('id').on('machiningorders')
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTable('machining_order_transactions')
}
