/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = async function (knex) {
    await knex.schema.createTable('build', (def) => {
      def.uuid('image_attachment_id')
    })
  }
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = async function (knex) {
    await knex.schema.alterTable('build', (def) => {
        def.dropColumn('image_attachment_id')
      })
  }
  