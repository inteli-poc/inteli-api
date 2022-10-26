/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  const uuidGenerateV4 = () => knex.raw('uuid_generate_v4()')
  const now = () => knex.fn.now()

  await knex.schema.createTable('orders', (def) => {
    def.uuid('id').defaultTo(uuidGenerateV4())
    def.string('supplier', 48).notNullable()
    def.specificType('items', 'uuid Array').notNullable()
    def.string('buyer', 48).notNullable()
    def
      .enu('status', ['Created', 'Submitted', 'AcknowledgedWithExceptions', 'Amended', 'Accepted', 'Cancelled'], {
        useNative: true,
        enumName: 'orderstatus',
      })
      .notNullable()
    def.datetime('created_at').notNullable().default(now())
    def.datetime('updated_at').notNullable().default(now())
    def.string('external_id').notNullable()
    def.string('comments')
    def.integer('latest_token_id')
    def.integer('original_token_id')
    def.string('business_partner_code').notNullable()
    def.primary(['id'])
    def.uuid('image_attachment_id')
    def.foreign('image_attachment_id').references('id').on('attachments').onDelete('CASCADE').onUpdate('CASCADE')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.schema.dropTable('orders')
}
