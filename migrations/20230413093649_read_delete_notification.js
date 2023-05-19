/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.table('notifications', (def) => {
    def.boolean('read')
    def.boolean('delete')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.table('notifications', (def) => {
    def.dropColumn('read')
    def.dropColumn('delete')
  })
}
