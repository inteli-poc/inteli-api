/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const uuidGenerateV4 = () => knex.raw('uuid_generate_v4()')
  const now = () => knex.fn.now()

  await knex.schema.createTable('machiningorders', (def) => {
    def.uuid('id').defaultTo(uuidGenerateV4())
    def.string('external_id').notNullable()
    def.string('supplier', 48).notNullable()
    def.string('buyer', 48).notNullable()
    def.string('task_id')
    def.specificType('part_id', 'uuid')
    def.foreign('part_id').references('id').on('parts')
    def
      .enu('status', ['Created', 'Submitted', 'Accepted', 'Started', 'Completed', 'Part Shipped'], {
        useNative: true,
        enumName: 'machineOrderStatus',
      })
      .notNullable()
    def.datetime('started_at')
    def.datetime('completed_at')
    def.datetime('created_at').notNullable().default(now())
    def.datetime('updated_at').notNullable().default(now())
    def.integer('latest_token_id')
    def.integer('original_token_id')
    def.primary(['id'])
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTable('machiningorders')
}
