/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  const uuidGenerateV4 = () => knex.raw('uuid_generate_v4()')
  const now = () => knex.fn.now()

  await knex.schema.createTable('orders', (def) => {
    def.uuid('id').defaultTo(uuidGenerateV4())
    def.string('supplier', 255).notNullable()
    def.specificType('items', 'uuid Array').notNullable()
    def.string('purchaser_address', '255').notNullable()
    def.datetime('required_by').notNullable()
    def.datetime('created_at').notNullable().default(now())
    def.datetime('updated_at').notNullable().default(now())
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.schema.dropTable('orders')
}
