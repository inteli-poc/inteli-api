exports.up = async (knex) => {
  const uuidGenerateV4 = () => knex.raw('uuid_generate_v4()')
  const now = () => knex.fn.now()

  await knex.schema.createTable('part_transactions', (def) => {
    def.uuid('id').defaultTo(uuidGenerateV4())
    def.integer('token_id')
    def.uuid('part_id').notNullable()
    def.enu('type', ['order-assignment', 'metadata-update', 'certification']).notNullable()
    def.enum('status', ['Submitted', 'InBlock', 'Finalised', 'Failed'], {
      enumName: 'tx_status',
      useNative: true,
      existingType: true,
    })
    def.datetime('created_at').notNullable().default(now())
    def.datetime('updated_at').notNullable().default(now())

    def.primary(['id'])
    def.foreign('part_id').references('id').on('parts')
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTable('part_transactions')
}
