/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const tableName = 'part_transactions'

exports.up = async (knex) => {
  let existRows = await knex.select().from(tableName)
  await knex.schema.table(tableName, (table) => table.dropColumn('type'))
  await knex.schema.table(tableName, (table) =>
    table
      .enu('type', [
        'Creation',
        'metadata-update',
        'certification',
        'acknowledgement',
        'amendment',
        'update-delivery-date',
        'ownership',
      ])
      .notNullable()
      .default('Creation')
  )
  await Promise.all(
    existRows.map((row) => {
      return knex(tableName).update({ type: row.type }).where('id', row.id)
    })
  )
}

exports.down = async (knex) => {
  let existRows = await knex.select().from(tableName)
  await knex.schema.table(tableName, (table) => table.dropColumn('type'))
  await knex.schema.table(tableName, (table) =>
    table
      .enu('type', [
        'Creation',
        'metadata-update',
        'certification',
        'acknowledgement',
        'amendment',
        'update-delivery-date',
      ])
      .notNullable()
      .default('Creation')
  )
  await Promise.all(
    existRows.map((row) => {
      if (row.type == 'ownership') {
        return knex(tableName).where('id', row.id).del()
      }
      return knex(tableName).update({ type: row.type }).where('id', row.id)
    })
  )
}
