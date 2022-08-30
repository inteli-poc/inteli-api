/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const uuidGenerateV4 = () => knex.raw('uuid_generate_v4()')
  const now = () => knex.fn.now()

  await knex.schema.createTable('build', (def) => {
    def.uuid('id').defaultTo(uuidGenerateV4())
    def.string('external_id').notNullable()
    def.string('supplier').notNullable()
    def
      .enu('status', ['Created', 'Scheduled', 'Started', 'Completed'], {
        useNative: true,
        enumName: 'buildstatus',
      })
      .notNullable()
    def.datetime('completion_estimate').notNullable()
    def.datetime('started_at')
    def.datetime('completed_at')
    def.datetime('created_at').notNullable().default(now())
    def.datetime('updated_at').notNullable().default(now())
    def.integer('latest_token_id')
    def.integer('original_token_id')
    def.uuid('attachment_id')
    def.primary(['id'])
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTable('build')
}
