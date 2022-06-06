/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex('recipes').del()

  await knex.schema.alterTable('recipes', (def) => {
    def.string('owner', 48).notNullable()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.schema.alterTable('recipes', (def) => {
    def.dropColumn('owner', 48)
  })
}
