/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const tableName = 'orders'

exports.up = async (knex) => {
  let existRows = await knex.select().from(tableName)
  await knex.schema.table(tableName, (table) => table.dropColumn('status'))
  await knex.schema.table(tableName, (table) =>
    table
      .enu('status', [
        'Created',
        'Submitted',
        'AcknowledgedWithExceptions',
        'Amended',
        'Accepted',
        'Cancelled',
        'Completed',
      ])
      .notNullable()
      .default('Created')
  )
  await Promise.all(
    existRows.map((row) => {
      return knex(tableName).update({ status: row.status }).where('id', row.id)
    })
  )
}

exports.down = async (knex) => {
  let existRows = await knex.select().from(tableName)
  await knex.schema.table(tableName, (table) => table.dropColumn('status'))
  await knex.schema.table(tableName, (table) =>
    table
      .enu('status', ['Created', 'Submitted', 'AcknowledgedWithExceptions', 'Amended', 'Accepted', 'Cancelled'])
      .notNullable()
      .default('Created')
  )
  await Promise.all(
    existRows.map((row) => {
      if (row.status == 'Completed') {
        return knex(tableName).where('id', row.id).del()
      }
      return knex(tableName).update({ status: row.status }).where('id', row.id)
    })
  )
}
