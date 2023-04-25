/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.table('notifications', (def) => {
    def.string('order_external_id')
    def.string('build_external_id')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.table('notifications', (def) => {
    def.dropColumn('order_external_id')
    def.dropColumn('build_external_id')
  })
}
