/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const uuidGenerateV4 = () => knex.raw('uuid_generate_v4()')
  const now = () => knex.fn.now()

  await knex.schema.createTable('parts', (def) => {
    def.uuid('id').defaultTo(uuidGenerateV4())
    def.specificType('recipe_id', 'uuid').notNullable()
    def.specificType('build_id', 'uuid')
    def.specificType('order_id', 'uuid')
    def.string('supplier').notNullable()
    def.json('certifications')
    def.json('metadata')
    def.datetime('forecast_delivery_date')
    def.datetime('created_at').notNullable().default(now())
    def.datetime('updated_at').notNullable().default(now())
    def.foreign('recipe_id').references('id').on('recipes')
    def.foreign('build_id').references('id').on('build')
    def.foreign('order_id').references('id').on('orders')
    def.integer('latest_token_id')
    def.integer('original_token_id')
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
    def.string('currency').notNullable()
    def.datetime('confirmed_receipt_date').notNullable()
    def.datetime('required_by').notNullable()
    def.foreign('image_attachment_id').references('id').on('attachments').onDelete('CASCADE').onUpdate('CASCADE')
    def.primary(['id'])
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTable('parts')
}
