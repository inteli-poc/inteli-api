/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('build_transactions', (def) => {
    def.dropColumn('type')
  })
  await knex.schema.alterTable('build_transactions', (def) => {
    def
      .enu('type', ['Schedule', 'Start', 'progress-update', 'Submit'], {
        useNative: true,
      })
      .notNullable()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('build_transactions', (def) => {
    def.dropColumn('type')
  })
  await knex.schema.alterTable('build_transactions', (def) => {
    def
      .enu('type', ['Schedule', 'Start', 'Submit'], {
        useNative: true,
      })
      .notNullable()
  })
}
