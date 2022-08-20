/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const uuidGenerateV4 = () => knex.raw('uuid_generate_v4()')
  const now = () => knex.fn.now()

  await knex.schema.createTable('order_transactions', (def) => {
    def.uuid('id').defaultTo(uuidGenerateV4())
    def.integer('token_id')
    def.uuid('order_id').notNullable()
    def
      .enu('type', ['Submission', 'Acknowledgement', 'Acceptance', 'Amendment'], {
        enumName: 'order_type',
        useNative: true,
      })
      .notNullable()
    def.enu('status', ['Submitted', 'InBlock', 'Finalised', 'Failed'], {
      enumName: 'tx_status',
      existingType: true,
      useNative: true,
    })
    def.datetime('created_at').notNullable().default(now())
    def.datetime('updated_at').notNullable().default(now())

    def.primary(['id'])
    def.foreign('order_id').references('id').on('orders')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTable('order_transactions')
}
