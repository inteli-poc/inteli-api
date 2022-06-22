/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.alterTable('recipes', (def) => {
    def.integer('latest_token_id')
    def.integer('original_token_id')
  })

  await knex.schema.alterTable('orders', (def) => {
    def.integer('latest_token_id')
    def.integer('original_token_id')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.schema.alterTable('recipes', (def) => {
    def.dropColumn('latest_token_id')
    def.dropColumn('original_token_id')
  })

  await knex.schema.alterTable('orders', (def) => {
    def.dropColumn('latest_token_id')
    def.dropColumn('original_token_id')
  })
}
