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
    def.datetime('required_by').notNullable()
    def.datetime('created_at').notNullable().default(now())
    def.datetime('updated_at').notNullable().default(now())
    def.string('external_id').notNullable()
    def.uuid('image_attachment_id')
    def.float('price').notNullable()
    def.integer('quantity').notNullable()
    def.string('delivery_terms').notNullable()
    def.string('description').notNullable()
    def.string('delivery_address').notNullable()
    def.string('price_type').notNullable()
    def.string('unit_of_measure').notNullable()
    def.string('export_classification').notNullable()
    def.string('line_text').notNullable()
    def.string('business_partner_code').notNullable()
    def.string('currency').notNullable()
    def.string('confirmed_receipt_date').notNullable()
    def.string('comments')
    def.integer('latest_token_id')
    def.integer('original_token_id')
    def.primary(['id'])
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
