/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const tableName = 'build'

exports.up = async (knex) => {
  let existRows = await knex.select().from(tableName)
  await knex.schema.table(tableName, (table) => table.dropColumn('status'))
  await knex.schema.table(tableName, (table) =>
    table
      .enu('status', ['Created', 'Scheduled', 'Started', 'Completed', 'Part Received'])
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
    table.enu('status', ['Created', 'Scheduled', 'Started', 'Completed']).notNullable().default('Created')
  )
  await Promise.all(
    existRows.map((row) => {
      if (row.status == 'Part Received') {
        return knex(tableName).where('id', row.id).del()
      }
      return knex(tableName).update({ status: row.status }).where('id', row.id)
    })
  )
}
