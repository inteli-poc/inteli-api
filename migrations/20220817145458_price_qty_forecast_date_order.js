/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = async (knex) => {
  
    await knex.schema.alterTable('orders', (def) => {
      def.float('price').notNullable()
      def.integer('quantity').notNullable()
      def.datetime('forecast_date').notNullable()
      def.string('comments')
    })
  }
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async (knex) => {
    await knex.schema.alterTable('orders', (def) => {
        def.dropColumn('price')
        def.dropColumn('quantity')
        def.dropColumn('forecast_date')
        def.dropColumn('comments')
    })
  }
  