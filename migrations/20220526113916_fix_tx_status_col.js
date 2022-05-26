/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.alterTable('recipe_transactions', (def) => {
    def.dropColumn('status')
  })

  await knex.schema.alterTable('recipe_transactions', (def) => {
    def.enum('status', ['Submitted', 'InBlock', 'Finalised', 'Failed'], {
      enumName: 'tx_status',
      useNative: true,
    })
  })

  await knex('recipe_transactions').update({ status: 'Submitted' })

  await knex.schema.alterTable('recipe_transactions', (def) => {
    def
      .enum('status', ['Submitted', 'InBlock', 'Finalised', 'Failed'], {
        enumName: 'tx_status',
        existingType: true,
        useNative: true,
      })
      .notNullable()
      .alter()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.schema.alterTable('recipe_transactions', (def) => {
    def.dropColumn('status')
  })

  await knex.schema.alterTable('recipe_transactions', (def) => {
    def.enu('status', ['Created', 'Submitted', 'Rejected', 'Amended', 'Accepted'])
  })

  await knex.raw('DROP TYPE tx_status')

  await knex('recipe_transactions').update({ status: 'Submitted' })
}
