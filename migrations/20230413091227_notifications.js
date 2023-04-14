/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  const uuidGenerateV4 = () => knex.raw('uuid_generate_v4()')
  const now = () => knex.fn.now()

  await knex.schema.createTable('notifications', (def) => {
    def.uuid('id').defaultTo(uuidGenerateV4())
    def.datetime('created_at').notNullable().default(now())
    def.string('external_id')
    def.string('description')
    def.primary(['id'])
    def.uuid('order_id')
    def.uuid('build_id')
    def.uuid('part_id')
    def.foreign('order_id').references('id').on('orders')
    def.foreign('build_id').references('id').on('build')
    def.foreign('part_id').references('id').on('parts')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.schema.dropTable('notifications')
}
